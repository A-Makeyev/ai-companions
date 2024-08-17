"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { Poppins } from "next/font/google"
import { ModeToggle } from "./mode-toggle"


const font = Poppins({
    weight: '600',
    subsets: ['latin']
})

export const Navbar = () => {
    return (
        <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary h-16">
            <div className="flex items-center">
                <MobileSidebar />
                <Link href="/">
                    <h1 className={cn(
                        "hidden md:block text-xl md:text-3xl font-bold text-primary",
                        font.className
                    )}>
                        companions.ai
                    </h1>
                </Link>
            </div>
            <div className="flex items-center gap-x-3">
                <Button variant="premium" size="sm">
                    Upgrage
                    <Sparkles className="h-4 w-4 fill-white text-white ml-2" />
                </Button>
                <UserButton />
                <ModeToggle />
            </div>
        </div>
    )
}