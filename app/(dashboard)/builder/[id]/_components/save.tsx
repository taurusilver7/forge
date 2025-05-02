import React from "react";
import { TableIcon } from "@radix-ui/react-icons";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const SaveBtn = () => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="gap-2">
					<DownloadIcon className="w-4 h-4" />
					Save
				</Button>
			</DialogTrigger>
			<DialogContent className="w-screen h-screen max-h-screen max-w-full flex flex-col flex-grow gap-0">
				<div className="px-4 py-2 border-b">
					<p className="text-lg font-bold text-muted-foreground">
						For Save For Public Submission
					</p>
					<p className="text-sm text-muted-foreground">
						This is how the form looks like to the public to submit
						records to the public database for the admin to collect data..
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SaveBtn;
