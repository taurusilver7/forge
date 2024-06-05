"use client";

import React from "react";
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
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ImSpinner } from "react-icons/im";
import { toast } from "./ui/use-toast";
import { formSchema, formSchemaType } from "@/lib/schema";
import { CreateForm } from "@/actions/form";
import { BsFileEarmarkPlus } from "react-icons/bs";

const CreateFormButton = () => {
	const form = useForm<formSchemaType>({
		resolver: zodResolver(formSchema),
	});

	const onSubmit = async (values: formSchemaType) => {
		// console.log(values);

		try {
			const formId = await CreateForm(values);
			toast({
				title: "Success",
				description: "Form created successfully",
				variant: "default",
			});
			console.log("FORM Id", formId);
		} catch (error) {
			toast({
				title: "Error",
				description: "Something went wrong, please try again later.",
				variant: "destructive",
			});
		}
	};
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					className="group border border-primary/20 h-48 items-center justify-center flex flex-col hover:border-primary hover:cursor-pointer border-dashed gap-4"
					variant="outline"
				>
					<BsFileEarmarkPlus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
					<p className="font-bold text-xl text-muted-foreground group-hover:text-primary">
						Create new form
					</p>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create form</DialogTitle>
					<DialogDescription>
						Create a new form to start collecting responses
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-2"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
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
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<DialogFooter>
					<Button
						onClick={form.handleSubmit(onSubmit)}
						disabled={form.formState.isSubmitting}
						className="w-full mt-4"
					>
						{!form.formState.isSubmitting && <span>Save</span>}
						{form.formState.isSubmitting && (
							<ImSpinner className="animate-spin" />
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateFormButton;
