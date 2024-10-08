"use client"

import qs from "query-string"
import { ChangeEventHandler, useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounse"


export const SearchInput = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    const name = searchParams.get('name')
    const categoryId = searchParams.get('categoryId')

    const [value, setValue] = useState(name || '')
    const debouncedValue = useDebounce<string>(value, 500)

    const search: ChangeEventHandler<HTMLInputElement> = (e) => {
        setValue(e.target.value)
    }

    useEffect(() => {
        const query = {
            name: debouncedValue,
            categoryId: categoryId
        }

        const url = qs.stringifyUrl({
            url: window.location.href,
            query,
        }, { skipEmptyString: true, skipNull: true })

        router.push(url)
    }, [debouncedValue, router, categoryId])

    return (
        <div className="relative">
            <Search className="absolute h-4 w-4 top-3 left-4 text-muted-foreground" />
            <Input
                value={value}
                onChange={search}
                placeholder="Search.."
                className="pl-10 bg-primary/10"
            />
        </div>
    )
}