import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";

export default function SaveEditor() {
  const [saveFile, setSaveFile] = useState(null);
  const [originalData, setOriginalData] = useState<Uint8Array | null>(null);
  const [values, setValues] = useState<any>({});

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const decompressed = await decompressGzip(arrayBuffer);
    const parsed = parseSaveFile(decompressed);
    setValues(parsed);
    setSaveFile(file);
    setOriginalData(decompressed);
  };

  const decompressGzip = async (arrayBuffer: ArrayBuffer): Promise<Uint8Array> => {
    const { ungzip } = await import("pako");
    return ungzip(new Uint8Array(arrayBuffer));
  };

  const compressGzip = async (data: Uint8Array): Promise<Blob> => {
    const { gzip } = await import("pako");
    const compressed = gzip(data);
    return new Blob([compressed], { type: "application/octet-stream" });
  };

  const parseSaveFile = (data: Uint8Array) => {
    const decoder = new TextDecoder("utf-16le");
    const result: any = {};
    const dv = new DataView(data.buffer);
    let i = 0;

    while (i < data.length) {
      try {
        const nameLength = data[i + 3];
        const name = decoder.decode(data.slice(i + 4, i + 4 + nameLength * 2));
        if (!/^[A-Za-z]+$/.test(name)) {
          i++;
          continue;
        }
        const valueOffset = i + 4 + nameLength * 2;
        const value = dv.getFloat64(valueOffset, true);
        result[name] = { offset: valueOffset, value };
        i = valueOffset + 8;
      } catch {
        i++;
      }
    }
    return result;
  };

  const handleValueChange = (key: string, value: string) => {
    setValues((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], value: parseFloat(value) },
    }));
  };

  const saveEditedFile = async () => {
    if (!originalData) return;
    const updatedData = new Uint8Array(originalData);
    const dv = new DataView(updatedData.buffer);

    for (const [key, { offset, value }] of Object.entries(values)) {
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
            {Object.entries(values).map(([key, { value }]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <label className="block text-sm font-medium mb-1">{key}</label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          <Button className="mt-6" onClick={saveEditedFile}>
            Zapisz zmodyfikowany plik
          </Button>
        </>
      )}
    </div>
  );
}
