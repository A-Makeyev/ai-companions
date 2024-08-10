import prismadb from "@/lib/prismadb"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from 'next/cache'


export async function POST(req: Request) {
    try {
        const body = await req.json()
        const user = await currentUser()
        const { name, src, seed, categoryId, description, instructions } = body

        if (!user || !user.id || !user.firstName) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        if (!name || !src || !seed || !categoryId || !description || !instructions) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const companion = await prismadb.companion.create({
            data: {
                name,
                src,
                seed,
                categoryId,
                description,
                instructions,
                userName: user.firstName,
                userId: user.id
            }
        })
        
        revalidatePath('/')
        return NextResponse.json(companion)
    } catch (error) {
        console.log('[ COMPANION POST ]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}