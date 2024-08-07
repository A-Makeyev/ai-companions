"use client"

import { ChatMessageProps } from "@/components/chat-message"
import { ChatMessages } from "@/components/chat-messages"
import { ChatForm } from "@/components/chat-form"
import { ChatHeader } from "@/components/chat-header"
import { Companion, Message } from "@prisma/client"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { useCompletion } from "ai/react"


interface ChatClientProps {
    companion: Companion & {
        messages: Message[]
        _count: {
            messages: number
        }
    }
}

export const ChatClient = ({
    companion
}: ChatClientProps) => {
    const router = useRouter()
    const [messages, setMessages] = useState<ChatMessageProps[]>(companion.messages)
    const {
        input,
        setInput,
        isLoading,
        handleSubmit,
        handleInputChange
    } = useCompletion({
        api: `/api/chat/${companion.id}`,
        onFinish(prompt, completion) {
            const systemMessage: ChatMessageProps = {
                role: 'system',
                content: completion
            }

            setMessages((current) => [...current, systemMessage])
            setInput('')

            router.refresh()
        }
    })

    const submitMessage = (e: FormEvent<HTMLFormElement>) => {
        const userMessage: ChatMessageProps = {
            role: 'user',
            content: input
        }

        setMessages((current) => [...current, userMessage])
        handleSubmit(e)
    }

    return (
        <div className="flex flex-col h-full p-4 space-y-2">
            <ChatHeader companion={companion} />
            <ChatMessages 
                messages={messages}
                companion={companion}
                isLoading={isLoading}
            />
            <ChatForm 
                input={input}
                isLoading={isLoading}
                onSubmit={submitMessage}
                handleInputChange={handleInputChange}
            />
        </div>
    )
}