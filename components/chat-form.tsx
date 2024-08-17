"use client"

import { ChatRequestOptions } from "ai"
import { Input } from "@/components/ui/input"
import { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { SendHorizonal } from "lucide-react"


interface ChatFormProps {
    input: string
    isLoading: boolean
    handleInputChange: (
        e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
    ) => void
    onSubmit: (
        e: FormEvent<HTMLFormElement>,
        chatRequestOptions?: ChatRequestOptions | undefined
    ) => void
}

export const ChatForm = ({
    input,
    isLoading,
    handleInputChange,
    onSubmit
}: ChatFormProps) => {
    return (
        <form onSubmit={onSubmit} className="border-t border-primary/10 py-4 flex items-center gap-x-2">
            <Input 
                value={input}
                disabled={isLoading}
                onChange={handleInputChange}
                placeholder="Type a message"
                className="rounged-lg bg-primary/10"
            />
            <Button variant="ghost" disabled={isLoading || !input || input.trim() === ''}>
                <SendHorizonal className="h-7 w-7 hover:scale-125 transition" />
            </Button>
        </form>
    )
}