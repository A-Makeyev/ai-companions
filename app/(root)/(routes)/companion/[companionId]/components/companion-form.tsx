"use client"

import * as z from "zod"
import axios from "axios"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Category, Companion } from "@prisma/client"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wand2 } from "lucide-react"
import { useRouter } from "next/navigation"


const PREAMBLE = 
`
    Imagine you are a fictional character whose name is Melon Musk, Evil twin of Elon Musk. 
    You are the CEO of Zesla & SpaceY, you enjoy painting, programming and reading sci-fi books. 
    You are currently talking to a human who is very interested to get to know you. 
    You are kind but can be sarcastic, give answers straight to the point. 
    You dislike repetitive questions. You get SUPER excited about books.
`

const SEED_CHAT = 
`
    Human: Hi, What is your name and your profession?
    System: My name is Melon Musk and I'm the CEO of Zesla & SpaceY.
    Human: Cool, Melon, how are you today?
    System: I’m doing great. I’m reading a book called Tomorrow and Tomorrow and really enjoyed it.
    Human: what is the book about?
    System: It’s about two friends come together as creative partners in the world of video game design.
    Human: that sounds fun. do you like video games? what are you playing now?
    System: Yes!!! I’m a huge fan. Playing the new legend of Zelda game every day.
    Human: oh amazing, what’s your favorite part of that game?
    System: Exploring the vast open world and discovering hidden treasures.
`

interface CompanionFormProps {
    initialData: Companion | null,
    categories: Category[]
}

const formSchema = z.object({
    categoryId: z.string().min(1, {
        message: 'Category is required'
    }),
    src: z.string().min(1, {
        message: 'Image is required'
    }),
    name: z.string().min(1, {
        message: 'Name is required'
    }).max(50),
    description: z.string().min(1, {
        message: 'Description is required'
    }).max(50),
    instructions: z.string().min(100, {
        message: 'Instructions require at least 100 characters'
    }).max(1000),
    seed: z.string().min(100, {
        message: 'Seed require at least 100 characters'
    }).max(1000),
})

export const CompanionForm = ({
    initialData, categories
}: CompanionFormProps) => {
    const router = useRouter()
    const { toast } = useToast()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: '',
            src: '',
            seed: '',
            description: '',
            instructions: '',
            categoryId: undefined
        }
    })

    const isLoading = form.formState.isSubmitting

    const createCompanion = async (values: z.infer<typeof formSchema>) => {
        try {
            if (initialData) {
                await axios.patch(`/api/companion/${initialData.id}`, values)
            } else {
                await axios.post('/api/companion', values)
            }

            toast({
                description: `"${values.name}" companion was ${initialData ? 'updated' : 'created'}`
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
        <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(createCompanion)} className="space-y-8 pb-10">
                    <div className="space-y-2 w-full">
                        <div>
                            <h3 className="text-lg font-medium">
                                General Information
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                General information about your companion
                            </p>
                        </div>
                        <Separator className="bg-primary/10" />
                    </div>
                    <FormField
                        name="src"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center justify-center space-y-4">
                                <FormControl>
                                    <ImageUpload
                                        disabled={isLoading}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            name="name"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Melon Musk"
                                            disabled={isLoading}
                                            maxLength={50}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This is how your AI Companion be named
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="description"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="CEO Founder"
                                            disabled={isLoading}
                                            maxLength={50}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Describe your AI Companion
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="categoryId"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        disabled={isLoading}
                                        value={field.value}
                                        defaultValue={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue
                                                    placeholder="Select a category"
                                                    defaultValue={field.value}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Select your AI category
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-2 w-full">
                        <div>
                            <h3 className="text-lg font-medium">
                                Configuration
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Istructions for your AI behaviour
                            </p>
                        </div>
                        <Separator className="bg-primary/10" />
                    </div>
                    <FormField
                        name="instructions"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                                <FormLabel>Instructions</FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="bg-background resize-none"
                                        placeholder={PREAMBLE}
                                        disabled={isLoading}
                                        maxLength={1000}
                                        {...field}
                                        rows={8}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Describe in details your companion&apos;s backstory and relevant information
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name="seed"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                                <FormLabel>Example Conversation</FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="bg-background resize-none"
                                        placeholder={SEED_CHAT}
                                        disabled={isLoading}
                                        maxLength={1000}
                                        {...field}
                                        rows={8}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Write an example of how your desired conversation would be like
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="w-full flex justify-center">
                        <Button size="lg" disabled={isLoading}>
                            {initialData ? "Edit Your Companion" : "Create Your Companion"}
                            <Wand2 className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}