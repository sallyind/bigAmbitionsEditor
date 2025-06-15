/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
const Card = ({ children }: any) => (
  <div className="bg-white shadow rounded-xl p-4">{children}</div>
);
const CardContent = ({ children }: any) => <div>{children}</div>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className="border p-2 w-full rounded" {...props} />
);
const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className="bg-blue-600 text-white px-4 py-2 rounded" {...props} />
);


export default function SaveEditor() {
//   const [, setSaveFile] = useState(null);
//   const [originalData, setOriginalData] = useState<Uint8Array | null>(null);
  const [values, setValues] = useState<any>({});

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const decompressed = await decompressGzip(arrayBuffer);

    console.log(decompressed);

    const json = JSON.parse(decompressed);
    if(json) {
    console.log("JSON parsed:", json);
    } else {
    console.error("Nie wygląda na JSON.");
    }
    
  };

  const decompressGzip = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const { ungzip } = await import("pako");
  const decompressed = ungzip(new Uint8Array(arrayBuffer));
  return new TextDecoder("utf-8").decode(decompressed);
};

  const compressGzip = async (data: Uint8Array): Promise<Blob> => {
    const { gzip } = await import("pako");
    const compressed = gzip(data);
    return new Blob([compressed], { type: "application/octet-stream" });
  };

//   const parseSaveFile = (data: Uint8Array) => {
//     const decoder = new TextDecoder("utf-16le");
//     const result: any = {};
//     const dv = new DataView(data.buffer);
//     let i = 0;

//     while (i < data.length) {
//       try {
//         const nameLength = data[i + 3];
//         const name = decoder.decode(data.slice(i + 4, i + 4 + nameLength * 2));
//         if (!/^[A-Za-z]+$/.test(name)) {
//           i++;
//           continue;
//         }
//         const valueOffset = i + 4 + nameLength * 2;
//         const value = dv.getFloat64(valueOffset, true);
//         result[name] = { offset: valueOffset, value };
//         i = valueOffset + 8;
//       } catch {
//         i++;
//       }
//     }
//     return result;
//   };

  const handleValueChange = (key: string, value: string) => {
    setValues((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], value: parseFloat(value) },
    }));
  };

  const saveEditedFile = async () => {
    let originalData;
    if (!originalData) return;
    const updatedData = new Uint8Array(originalData);
    const dv = new DataView(updatedData.buffer);

    for (const [, val] of Object.entries(values)) {
    const { offset, value } = val as { offset: number; value: number };
    dv.setFloat64(offset, value, true);
    }


    const blob = await compressGzip(updatedData);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edited_save.hsg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Big Ambitions Save Editor</h1>
      <Input type="file" accept=".hsg" onChange={handleFileUpload} />
      {Object.keys(values).length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {Object.entries(values).map(([key, val]) => {
            const { value } = val as { value: number };
            return (
                <Card key={key}>
                <CardContent className="p-4">
                    <label className="block text-sm font-medium mb-1">{key}</label>
                    <Input
                    type="number"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleValueChange(key, e.target.value)
                    }
                    />
                </CardContent>
                </Card>
            );
            })}
          </div>
          <Button className="mt-6" onClick={saveEditedFile}>
            Zapisz zmodyfikowany plik
          </Button>
        </>
      )}
    </div>
  );
}
