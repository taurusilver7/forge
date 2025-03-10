"use client";

import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const Error = ({ error }: { error: Error }) => {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
      <Image
        src="/error.png"
        alt="empty"
        height="400"
        width="400"
        className="dark:hidden"
      />
      <Image
        src="/error-dark.png"
        alt="empty"
        height="400"
        width="400"
        className="dark:block hidden"
        priority
      />
      <h2 className="text-xl font-medium text-center">
        Oops! Looks like you&apos;re lost here!
        <br />
        <span className="">No worries!</span>
      </h2>
      <Button asChild>
        <Link href="/">Go back</Link>
      </Button>
    </div>
  );
};

export default Error;
