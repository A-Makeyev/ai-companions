import prismadb from "@/lib/prismadb"
import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { revalidatePath } from 'next/cache'


export async function PATCH(
    req: Request,
    { params }: { params: { companionId: string }}
) {
    try {
        const body = await req.json()
        const user = await currentUser()
        const { name, src, seed, categoryId, description, instructions } = body

        if (!params.companionId) {
            return new NextResponse('Companion ID is required', { status: 400 })
        }

        if (!user || !user.id || !user.firstName) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        if (!name || !src || !seed || !categoryId || !description || !instructions) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const companion = await prismadb.companion.update({
            where: {
                userId: user.id,
                id: params.companionId
            },
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
        
        return NextResponse.json(companion)
    } catch (error) {
        console.log('[ COMPANION PATCH ]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { companionId: string }}
) {
    try {
        const { userId } = auth()

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const companion = await prismadb.companion.delete({
            where: {
                userId,
                id: params.companionId
            }
        })
        
        revalidatePath('/')
        return NextResponse.json(companion)
    } catch (error) {
        console.log('[ COMPANION DELETE ]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}