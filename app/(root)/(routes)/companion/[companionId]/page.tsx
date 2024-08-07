import prismadb from "@/lib/prismadb"
import { CompanionForm } from "./components/companion-form"
import { auth } from "@clerk/nextjs/server"


interface CompanionIdPageProps {
    params: {
        companionId: string
    }
}

const CompanionPage = async ({
    params
}: CompanionIdPageProps) => {
    const { userId } = auth()

    if (!userId) {
        return auth().redirectToSignIn()
    }

    const companion = await prismadb.companion.findUnique({
        where: {
            id: params.companionId
        }
    })

    const categories = await prismadb.category.findMany()

    return (
        <CompanionForm
            initialData={companion}
            categories={categories}
        />
    )
}

export default CompanionPage