import { Button } from "@/components/ui/button";
import { RocketIcon, UploadIcon } from "@radix-ui/react-icons";
import React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FaSpinner } from "react-icons/fa";

const Publish = () => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="outline"
					className="gap-1 text-white bg-gradient-to-r from-indigo-500 to-cyan-500"
				>
					<RocketIcon className="w-4 h-4 font-bold" />
					Publish
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. You will not be able to edit
						after publishing the form. <br />
						<span className="font-medium">
							You&apos;re making the form public to collect submissions
							from users.
						</span>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
						}}
					>
						Proceed
						{false && <FaSpinner className="animate-spin" />}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default Publish;
