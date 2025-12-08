import React, { useTransition } from "react";
import { TableIcon, UpdateIcon } from "@radix-ui/react-icons";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

import useDesigner from "@/hooks/useDesigner";
import { UpdateFormContent } from "@/actions/form";
import { toast } from "@/components/ui/use-toast";

const SaveBtn = ({ id }: { id: string }) => {
	const { elements } = useDesigner();

	const [loading, startTransition] = useTransition();

	const updateContent = async () => {
		try {
			const jsonElements = JSON.stringify(elements);
			// server action for form update
			await UpdateFormContent(id, jsonElements);
			toast({
				title: "Success",
				description: "Form Saved successfully",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Form not saved, Something went wrong",
				variant: "destructive",
			});
		}
	};
	return (
		<Button
			variant={"outline"}
			className="gap-2"
			disabled={loading}
			onClick={() => {
				startTransition(updateContent);
			}}
		>
			<DownloadIcon className="h-6 w-6" />
			Save
			{loading && <UpdateIcon className="animate-spin" />}
		</Button>
	);
};

export default SaveBtn;
