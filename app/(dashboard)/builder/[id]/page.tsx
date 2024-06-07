import { GetFormById } from "@/actions/form";
import React from "react";
import FormBuilder from "./_components/form-builder";

const BuilderPage = async ({ params }: { params: { id: string } }) => {
	const { id } = params;

	const modifiedId = `${id}`;

	const form = await GetFormById(modifiedId);

	if (!form) {
		throw new Error("Form not found!");
	}

	// console.log(form);

	return <FormBuilder form={form} />;
};

export default BuilderPage;
