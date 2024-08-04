import Link from "next/link"
import Image from "next/image"
import { Companion } from "@prisma/client"
import { MessageSquare } from "lucide-react"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"


interface CompanionProps {
    data: (Companion & {
        _count: {
            messages: number
        }
    })[]
}

export const Companions = ({
    data
}: CompanionProps) => {
    if (data.length === 0) {
        return (
            <div className="pt-10 flex flex-col items-center justify-center space-y-3">
                <div className="relative w-60 h-60">
                    <Image
                        fill
                        alt="Empty"
                        src="/empty.png"
                        className="grayscale"
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    No companions were found
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-10">
            {data.map((item) => (
                <Card
                    key={item.id}
                    className="bg-primary/10 rounted-xl cursor-pointer hover:opacity-75 transition border-0"
                >
                    <Link href={`/chat/${item.id}`}>
                        <CardHeader className="flex items-center justify-center text-center text-muted-foreground">
                            <div className="relative w-32 h-32">
                                <Image 
                                    fill
                                    alt={item.name}
                                    src={item.src}
                                    className="rounded-xl object-cover"
                                />
                            </div>
                            <p className="font-bold">
                                {item.name}
                            </p>
                            <p className="text-s">
                                {item.description}
                            </p>
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between text-s text-muted-foreground">
                            <p className="lowercase">
                                @{item.userName}
                            </p>
                            <div className="flex items-center">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {item._count.messages > 0 && item._count.messages}
                            </div>
                        </CardFooter>
                    </Link>
                </Card>
            ))}
        </div>
    )
}
