import React from "react";
import { Card } from "@tremor/react";

export default function CardStatistics({ title, value, description }) {
    return (
            <Card className="mx-auto max-w-xs flex flex-col justify-around items-center text-center" decoration="top" decorationColor="#dbeafe">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 12a6 6 0 100-12 6 6 0 000 12z"></path>
                    </svg>
                </div>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content" dangerouslySetInnerHTML={{ __html: title }}></p>
                <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">{value}</p>
                <p className="text-[12px] mt-2 text-tremor-content">{description}</p>
            </Card>
    );
}