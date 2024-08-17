"use client"

import { Companion } from "@prisma/client"
import { ElementRef, useEffect, useRef, useState } from "react"
import { ChatMessage, ChatMessageProps } from "@/components/chat-message"


interface ChatMessagesProps {
    messages: ChatMessageProps[]
    isLoading: boolean
    companion: Companion
}

export const ChatMessages = ({
    messages = [],
    isLoading,
    companion
}: ChatMessagesProps) => {
    const scrollRef = useRef<ElementRef<'div'>>(null)
    const [fakeLoading, setFakeLoading] = useState(messages.length === 0 ? true : false)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setFakeLoading(false)
        }, 1000)

        return () => {
            clearTimeout(timeout)
        }
    }, [])

    useEffect(() => {
        scrollRef?.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    return (
        <div className="flex-1 overflow-y-auto pr-4">
            <ChatMessage 
                role="system"
                isLoading={fakeLoading}
                content={`Hello, I'm ${companion.name}, ${companion.description}`}
                src={companion.src}
            />
            {messages.map((message, key) => (
                <ChatMessage 
                    key={key}
                    content={message.content}
                    role={message.role}
                    src={companion.src}
                />
            ))}
            {isLoading && (
                <ChatMessage
                    role="system"
                    isLoading
                    src={companion.src}
                />
            )}
            <div ref={scrollRef} />
        </div>
    )
}