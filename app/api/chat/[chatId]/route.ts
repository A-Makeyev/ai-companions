import prismadb from "@/lib/prismadb"
import { LangChainAdapter } from "ai"
import { NextResponse } from "next/server"
import { ChatGroq } from "@langchain/groq"
import { currentUser } from "@clerk/nextjs/server"
import { StringOutputParser } from "@langchain/core/output_parsers"
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

        const getCompanion = await prismadb.companion.findUnique({
            where: { 
                id: params.chatId 
                // userId: user.id
            },
            include: {
                messages: {
                    orderBy: { 
                        createdAt: 'asc' 
                    },
                    take: 10, 
                },
            },
        })

        if (!getCompanion) {
            return new NextResponse('Companion not found', { status: 404 })
        }

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

        const companionKey = {
            userId: user.id,
            companionId: companion.id,
            modelName: 'mixtral-8x7b-32768'
        }

        // https://console.groq.com/docs/models
        const model = new ChatGroq({
            temperature: 0,
            model: 'mixtral-8x7b-32768',
            apiKey: process.env.GROQ_API_KEY,
            callbacks: [new ConsoleCallbackHandler()]
        })

        // Turn verbose on for debugging
        model.verbose = true

        const systemMessage = `Your name is ${companion.name}, ${companion.description}. ${companion.instructions}.`

        const messages = [
            new SystemMessage(systemMessage),
            ...getCompanion.messages.map(msg => 
                msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
            ),
            new HumanMessage(prompt)
        ]

        const resp = await model.invoke(messages).catch(console.error);

        const content = resp?.content as string;

        if (!content || content.length < 1) {
            return new NextResponse('Content not found', { status: 404 });
        }
        
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

        const parser = new StringOutputParser();
        const stream = await model.pipe(parser).stream(messages);

        return LangChainAdapter.toDataStreamResponse(stream)
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}