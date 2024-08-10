import prismadb from '@/lib/prismadb'
import { LangChainAdapter } from 'ai'
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { MemoryManager } from '@/lib/memory'
import { rateLimit } from '@/lib/rate-limit'
import { ChatOpenAI } from '@langchain/openai'
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console"
// import { checkAiRequestsCount, decreaseAiRequestsCount } from '@/lib/user-settings'
// import { checkSubscription } from '@/lib/subscription'
// import dotenv from 'dotenv'

// dotenv.config({ path: `.env` })

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } },
) {
    try {
        const { prompt } = await request.json()
        const user = await currentUser()

        if (!user || !user.firstName || !user.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const identifier = request.url + '-' + user.id
        const { success } = await rateLimit(identifier)

        if (!success) {
            return new NextResponse('Rate limit exceeded', { status: 429 })
        }

        // const isPro = await checkSubscription()

        // if (!isPro) {
        //   const checkAiRequestsCountResp = await checkAiRequestsCount()

        //   if (!checkAiRequestsCountResp) {
        //     return new NextResponse('Premium subscription is required', {
        //       status: 402,
        //     })
        //   }
        // }

        const companion = await prismadb.companion.update({
            where: {
                id: params.chatId,
                // userId: user.id
            },
            data: {
                messages: {
                    create: {
                        role: 'user',
                        userId: user.id,
                        content: prompt,
                    },
                },
            },
        })

        if (!companion) {
            return new NextResponse('Companion not found', { status: 404 })
        }

        const companion_file_name = companion.id! + '.txt'

        const companionKey = {
            userId: user.id,
            companionId: companion.id,
            modelName: 'gpt-3.5-turbo',
        }

        const memoryManager = await MemoryManager.getInstance()
        const records = await memoryManager.readLatestHistory(companionKey)

        if (records.length === 0) {
            await memoryManager.seedChatHistory(companion.seed, '\n\n', companionKey)
        }

        await memoryManager.writeToHistory('User: ' + prompt + '\n', companionKey)
        const recentChatHistory = await memoryManager.readLatestHistory(companionKey)

        // Right now the preamble is included in the similarity search, but that shouldn't be an issue

        const similarDocs = await memoryManager.vectorSearch(
            recentChatHistory,
            companion_file_name,
        )

        let relevantHistory = ''
        if (!!similarDocs && similarDocs.length !== 0) {
            relevantHistory = similarDocs.map((doc) => doc.pageContent).join('\n')
        }

        const model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'gpt-3.5-turbo',
            callbacks: [new ConsoleCallbackHandler()]
        })

        // Turn verbose on for debugging
        model.verbose = true

        const resp = await model.invoke(`
            ${companion.instructions}

            Try to give responses that are straight to the point. 
            Generate sentences without a prefix of who is speaking. Don't use ${companion.name} prefix.
            Below are relevant details about ${companion.name}'s past and the conversation you are in.

            ${relevantHistory}

            ${recentChatHistory}\n${companion.name}:
        `).catch(console.error)

        const content = resp?.content as string

        if (!content && content?.length < 1) {
            return new NextResponse('Content not found', { status: 404 })
        }

        var Readable = require('stream').Readable
        let s = new Readable()
        s.push(content)
        s.push(null)

        memoryManager.writeToHistory('' + content, companionKey)

        await prismadb.companion.update({
            where: {
                id: params.chatId,
                // userId: user.id
            },
            data: {
                messages: {
                    create: {
                        role: 'system',
                        userId: user.id,
                        content: content,
                    },
                },
            },
        })

        // if (!isPro) {
        //   await decreaseAiRequestsCount()
        // }

        const parser = new StringOutputParser()
        const stream = await model.pipe(parser).stream(prompt)

        return LangChainAdapter.toDataStreamResponse(stream)
        // return LangChainAdapter.toDataStreamResponse(s)
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}
