import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TableIcon } from "@radix-ui/react-icons";
import React from "react";

const Preview = () => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="gap-2">
					<TableIcon className="w-4 h-4" />
					Preview
				</Button>
			</DialogTrigger>
			<DialogContent className="w-screen h-screen max-h-screen max-w-full flex flex-col flex-grow gap-0">
				<div className="px-4 py-2 border-b">
					<p className="text-lg font-bold text-muted-foreground">
						Form preview
					</p>
					<p className="text-sm text-muted-foreground">
						This is how the form looks like.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Preview;
