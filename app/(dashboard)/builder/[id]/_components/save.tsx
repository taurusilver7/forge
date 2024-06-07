import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@radix-ui/react-icons";
import React from "react";

const SaveBtn = () => {
	return (
		<Button variant="outline" className="gap-2">
			<DownloadIcon className="w-4 h-4" />
			Save
		</Button>
	);
};

export default SaveBtn;
