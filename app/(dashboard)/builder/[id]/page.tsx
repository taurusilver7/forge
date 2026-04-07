import React from "react";
import { GetFormById } from "@/actions/form";
import FormBuilder from "./_components/form-builder";

const BuilderPage = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const form = await GetFormById(id);
	if (!form) {
		throw new Error("Form not found!");
	}

	// console.log(form);

	return <FormBuilder form={form} />;
};

export default BuilderPage;
