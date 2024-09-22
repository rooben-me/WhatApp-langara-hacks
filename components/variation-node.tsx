import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Variation {
  id: number;
  name: string;
  html: string;
  children: Variation[];
  version: string;
  htmlImg: string;
}

interface VariationNodeProps {
  variations: Variation[];
  onSelect: (variation: Variation) => void;
  selectedVariation: Variation | null;
}

export const VariationNode: React.FC<VariationNodeProps> = ({ variations, onSelect, selectedVariation }) => {
  const handleSelect = (variation: Variation) => {
    onSelect(variation);
  };

  // Group variations by version
  const groupedVariations = variations.reduce((acc, variation) => {
    const version = variation.version;
    if (!acc[version]) {
      acc[version] = [];
    }
    acc[version].push(variation);
    return acc;
  }, {} as Record<string, Variation[]>);

  // Sort versions
  const sortedVersions = Object.keys(groupedVariations).sort((a, b) => {
    return parseInt(a.slice(1)) - parseInt(b.slice(1));
  });

  return (
    <div className="w-full">
      {sortedVersions.map((version, index) => (
        <React.Fragment key={version}>
          {index > 0 && <hr className="my-6 border-gray-300" />}
          <h3 className="text-lg font-semibold mb-4">{version}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {groupedVariations[version].map((variation) => (
              <Card key={variation.id} className={`cursor-pointer transition-all duration-200 ${selectedVariation?.id === variation.id ? "ring-2 ring-blue-500" : ""}`} onClick={() => handleSelect(variation)}>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <div className="flex justify-between items-center gap-2 w-full">
                      {variation.name}
                      <span className="ml-2 text-xs font-medium bg-blue-200 text-blue-800 rounded-full px-2 py-1">{variation.version.split(" ")[0]}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full h-32 flex items-center justify-center text-gray-400 bg-gray-100 rounded">
                    <img src={variation.htmlImg} alt="App Preview" className="max-w-full max-h-full object-cover" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
