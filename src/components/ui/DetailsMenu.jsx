import { Button } from "@tremor/react";
import React from "react";
import MoneyTip from "./MoneyTip";

export default function DetailsMenu({ isDmOpen, setisDmOpen, data }) {
    console.log(data)
    return(
        <div className='fixed z-40 top-0 left-0 w-full h-full flex justify-center items-center'>
            {isDmOpen && (
                <div onClick={() => setisDmOpen(false)} className="fixed bg-[#00000021] z-40 inset-0 flex justify-center items-center">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">{data.name}</h2>
                                <MoneyTip exchangeRates={[{ amount: data.price }, data.price_conversions]} />
                            </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Descripción</h3>
                                <p className="text-gray-600">
                                    {data.description || 'No hay descripción disponible'}
                                </p>
                            </div>
                            <div className="mt-2 mb-4 flex flex-col justify-between">
                                <p className="text-gray-700"><strong>Componentes alérgenos:</strong></p>
                                {data.allegers.length === 0 ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-green-700">No hay componentes alérgenos</p>
                                    </div>
                                ) : (
                                    <ul className="list-disc list-inside">
                                        {data.allegers.map((alleger) => (
                                            <li key={alleger}>{alleger}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <div className="text-sm text-gray-500">
                                    ID: {data.id_menu}
                                </div>
                                <Button
                                    onClick={() => setisDmOpen(false)}
                                    className="border-none bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
