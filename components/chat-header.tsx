"use client"

import { useUser } from "@clerk/nextjs"
import { Companion, Message } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"
import { BotAvatar } from "@/components/bot-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronLeft, Edit, MessageSquare, MoreVertical, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import axios from "axios"


interface ChatHeaderProps {
    companion: Companion & {
        messages: Message[]
        _count: {
            messages: number
        }
    }
}

export const ChatHeader = ({
    companion
}: ChatHeaderProps) => {
    const router = useRouter()
    const { user } = useUser()
    const { toast } = useToast()

    const deleteCompanion = async () => {
        try {
            await axios.delete(`/api/companion/${companion.id}`)

            toast({
                description: `Deleted "${companion.name}" successfully!`
            })

            router.push('/')
            router.refresh()
        } catch (error) {
            toast({
                variant: 'destructive',
                description: `Something went wrong! ${error}`
            })
        }
    }

    return (
        <div className="flex w-full justify-between items-center border-b border-primary/10 pb-4">
            <div className="flex gap-x-2 items-center">
                <Button onClick={() => router.back()} size="icon" variant="ghost">
                    <ChevronLeft className="h-8 w-8 hover:scale-125 transition" />
                </Button>
                <BotAvatar src={companion.src} />
                <div className="flex flex-col gap-y-1">
                    <div className="flex items-center gap-x-2">
                        <p className="font-bold">
                            {companion.name}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                            {companion._count.messages > 0 && (
                                <div>
                                    <MessageSquare className="w-4 h-4 mr-1 inline-block" /> 
                                    {companion._count.messages}
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Created by @{companion.userName}
                    </p>
                </div>
            </div>
            {user?.id === companion.userId && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary">
                            <MoreVertical className="hover:scale-125 transition" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/companion/${companion.id}`)} className="cursor-pointer hover:bg-primary/10 transition">
                            <Edit className="w-4 h-4 mr-2 cursor-pointer" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={deleteCompanion } className="cursor-pointer hover:bg-primary/10 transition">
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}