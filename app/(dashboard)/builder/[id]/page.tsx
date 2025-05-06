import React from "react";
import { GetFormById } from "@/actions/form";
import FormBuilder from "./_components/form-builder";

const BuilderPage = async ({ params }: { params: { id: string } }) => {
	const { id } = params;
	const form = await GetFormById(id);
	if (!form) {
		throw new Error("Form not found!");
	}

	// console.log(form);

	return <FormBuilder form={form} />;
};

export default BuilderPage;
