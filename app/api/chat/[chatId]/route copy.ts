import prismadb from "@/lib/prismadb"
import { LangChainAdapter } from "ai"
import { NextResponse } from "next/server"
import { ChatGroq } from "@langchain/groq"
import { currentUser } from "@clerk/nextjs/server"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { MemoryManager } from "@/lib/memory"
import { rateLimit } from "@/lib/rate-limit"
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console"
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages"
// import { checkAiRequestsCount, decreaseAiRequestsCount } from "@/lib/user-settings'
// import { checkSubscription } from "@/lib/subscription'
// import dotenv from "dotenv'
import { Readable } from 'stream'
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
            modelName: 'mixtral-8x7b-32768'
        }

        // const memoryManager = await MemoryManager.getInstance()
        // const records = await memoryManager.readLatestHistory(companionKey)

        // if (records.length === 0) {
        //     await memoryManager.seedChatHistory(companion.seed, '\n\n', companionKey)
        // }

        // await memoryManager.writeToHistory('User: ' + prompt + '\n', companionKey)
        // const recentChatHistory = await memoryManager.readLatestHistory(companionKey)

        // // Right now the preamble is included in the similarity search, but that shouldn't be an issue

        // const similarDocs = await memoryManager.vectorSearch(
        //     recentChatHistory,
        //     companion_file_name,
        // )

        // let relevantHistory = ''
        // if (!!similarDocs && similarDocs.length !== 0) {
        //     relevantHistory = similarDocs.map((doc) => doc.pageContent).join('\n')
        // }

        // https://console.groq.com/docs/models
        const model = new ChatGroq({
            temperature: 0,
            model: 'mixtral-8x7b-32768',
            apiKey: process.env.GROQ_API_KEY,
            callbacks: [new ConsoleCallbackHandler()]
        })

        // Turn verbose on for debugging
        model.verbose = true

        const systemMessage = 
        `
            ${companion.instructions}
            Your name is ${companion.name}.
            ${companion.description}
        `

        // const messages = [
        //     new SystemMessage(systemMessage),
        //     ...recentChatHistory.split('\n').map(message => {
        //         const [role, content] = message.split(': ');
        //         return role.toLowerCase() === 'human' 
        //             ? new HumanMessage(content)
        //             : new AIMessage(content);
        //     }),
        //     new HumanMessage(prompt)
        // ]

        const messages = [
            new SystemMessage(systemMessage),
            new HumanMessage(prompt)
        ]

        const resp = await model.invoke(messages).catch(console.error);

        const content = resp?.content as string;

        if (!content || content.length < 1) {
            return new NextResponse('Content not found', { status: 404 });
        }

        //memoryManager.writeToHistory('' + content, companionKey)

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

        
          
        console.log('*'.repeat(150))
        console.log(content)
        console.log('*'.repeat(150))
        
        const parser = new StringOutputParser();
        const stream = await model.pipe(parser).stream(messages);

        return LangChainAdapter.toDataStreamResponse(stream)
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}