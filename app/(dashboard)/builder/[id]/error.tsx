"use client";

import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

const Error = ({ error }: { error: Error }) => {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
      <AlertCircle className="h-24 w-24 text-muted-foreground" />
      <h2 className="text-xl font-medium text-center">
        Oops! Something went wrong.
      </h2>
      <Button asChild>
        <Link href="/">Go back</Link>
      </Button>
    </div>
  );
};

export default Error;
