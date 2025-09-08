import React, { useState } from "react";
import DialogOrder from "./DialogOrders";
import { useAuth } from "../../AuthContext";

export default function CardTable({ data }) {
    const { user } = useAuth();
    const [showDetails, setShowDetails] = useState(false);

    console.log(user);

    return(
        <>
            <div key={data.id_table} onClick={() => setShowDetails(!showDetails)} className={`group cursor-pointer relative p-6 rounded-xl shadow-md flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${data.status_name === 'Activo' ? 'bg-green-500 text-white' : 'bg-red-700 text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="size-10 m-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <h3 className="text-lg font-bold">Mesa {data.number}</h3>
                <p>Seccion: {data.section}</p>
                <p>Capacidad: {data.capacity}</p>
                {data.waiter_name && (
                    <p>Mesero: {data.waiter_name}</p>
                )}
                {data.guests && (
                    <p>Invitados: {data.guests}</p>
                )}
            </div>
            {showDetails && (data.waiter_name === user.name || user.role === 'admin' || data.status_name === 'Activo') && (
                <div onClick={() => setShowDetails(false)} className="fixed bg-black/70 z-40  inset-0 flex justify-center items-center">
                    <div onClick={(e) => e.stopPropagation()}>
                        <DialogOrder isOpen={showDetails} setisOpen={setShowDetails} data={data} />
                    </div>
                </div>
            )}
        </>
    )
}