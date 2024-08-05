import prismadb from "@/lib/prismadb"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ChatClient } from "./components/client"


interface ChatIdProps {
    params: {
        chatId: string
    }
}

const ChatIdPage = async ({
    params
}: ChatIdProps) => {
    const { userId } = auth()

    if (!userId) {
        return auth().redirectToSignIn()
    }

    const companion = await prismadb.companion.findUnique({
        where: {
            id: params.chatId
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: 'asc'
                },
                where: {
                    userId
                }
            },
            _count: {
                select: {
                    messages: true
                }
            }
        }
    })

    if (!companion) {
        return redirect('/')
    }

    return (
        <ChatClient companion={companion} />
    )
}

export default ChatIdPage