import React from "react";

export default function DetailsMenu({ isDmOpen, setisDmOpen, data }) {
    return(
        <div className='fixed z-40 top-0 left-0 w-full h-full flex justify-center items-center'>
            {isDmOpen && (
                <div onClick={() => setisDmOpen(false)} className="fixed bg-[#00000021] z-40 inset-0 flex justify-center items-center">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-2xl font-bold mb-4">{data.name}</h2>
                        <p className="text-gray-700 mb-2"><strong>Precio:</strong> ${data.price}</p>
                        <p className="text-gray-700 mb-4"><strong>Descripción:</strong> {data.description}</p>
                        <button
                            onClick={() => setisDmOpen(false)}
                            className="clean bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
