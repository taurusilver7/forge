"use client";

import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Loader2, FilePlus } from "lucide-react";
import { toast } from "./ui/use-toast";
import { formSchema, formSchemaType } from "@/lib/schema";
import { CreateForm } from "@/actions/form";
import { templates, FormTemplate } from "@/lib/templates";
import { GetUserTemplates } from "@/actions/template";
import { useRouter } from "next/navigation";

const CreateFormButton = () => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
	const [userTemplates, setUserTemplates] = useState<FormTemplate[]>([]);
	const form = useForm<formSchemaType>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: "", description: "" },
	});

	useEffect(() => {
		if (!open) return;
		(async () => {
			try {
				const data = await GetUserTemplates();
				setUserTemplates(
					data.map((t) => ({
						id: t.id,
						name: t.name,
						description: t.description,
						category: t.category,
						elements: JSON.parse(t.content),
					}))
				);
			} catch { /* not signed in */ }
		})();
	}, [open]);

	const onSubmit = async (values: formSchemaType) => {
		try {
			const formData = selectedTemplate
				? { ...values, content: JSON.stringify(selectedTemplate.elements) }
				: values;
			const formId = await CreateForm(formData);
			toast({
				title: "Success",
				description: "Form created successfully",
				variant: "default",
			});
			form.reset();
			setSelectedTemplate(null);
			setOpen(false);
			router.push(`/builder/${formId}`);
		} catch (error) {
			toast({
				title: "Error",
				description: "Something went wrong, please try again later.",
				variant: "destructive",
			});
			router.refresh();
		}
	};

	const selectTemplate = (tpl: FormTemplate) => {
		setSelectedTemplate(tpl);
		form.setValue("name", tpl.name);
		form.setValue("description", tpl.description);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					className="group border border-primary/20 h-48 items-center justify-center flex flex-col hover:border-primary hover:cursor-pointer border-dashed gap-4"
					variant="outline"
				>
					<FilePlus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
					<p className="font-bold text-xl text-muted-foreground group-hover:text-primary">
						Create new form
					</p>
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Create Form</DialogTitle>
					<DialogDescription>
						Create a new form to start collecting responses
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="blank" onValueChange={() => setSelectedTemplate(null)}>
					<TabsList className="w-full">
						<TabsTrigger value="blank" className="flex-1">Blank Form</TabsTrigger>
						<TabsTrigger value="template" className="flex-1">From Template</TabsTrigger>
					</TabsList>
					<TabsContent value="blank">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea rows={5} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</form>
						</Form>
					</TabsContent>
					<TabsContent value="template">
						<div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
							{[...userTemplates, ...templates].map((tpl) => (
								<Card
									key={tpl.id}
									className={`cursor-pointer transition-colors ${
										selectedTemplate?.id === tpl.id
											? "border-primary ring-1 ring-primary"
											: "hover:border-primary/50"
									}`}
									onClick={() => selectTemplate(tpl)}
								>
									<CardHeader className="p-3">
										<CardTitle className="text-sm">{tpl.name}</CardTitle>
										<CardDescription className="text-xs">{tpl.description}</CardDescription>
									</CardHeader>
								</Card>
							))}
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button
						onClick={form.handleSubmit(onSubmit)}
						disabled={form.formState.isSubmitting}
						className="w-full mt-4"
					>
						{!form.formState.isSubmitting && <span>Create</span>}
						{form.formState.isSubmitting && (
							<Loader2 className="animate-spin" />
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateFormButton;
