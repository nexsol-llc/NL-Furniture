const fs = require('fs');
let text = fs.readFileSync('src/app/admin/blog/page.tsx', 'utf8');

// 1. Imports
text = text.replace(
  'import { useState, useEffect } from "react";\nimport Image from "next/image";',
  'import { useState, useEffect } from "react";\nimport Image from "next/image";\nimport dynamic from "next/dynamic";\nimport "react-quill/dist/quill.snow.css";\n\nconst ReactQuill = dynamic(() => import("react-quill"), { ssr: false });'
);
text = text.replace(
  'import { useState, useEffect } from "react";\r\nimport Image from "next/image";',
  'import { useState, useEffect } from "react";\r\nimport Image from "next/image";\r\nimport dynamic from "next/dynamic";\r\nimport "react-quill/dist/quill.snow.css";\r\n\r\nconst ReactQuill = dynamic(() => import("react-quill"), { ssr: false });'
);

// 2. Categories state
text = text.replace(
  'const [adminSearch, setAdminSearch] = useState("");',
  'const [adminSearch, setAdminSearch] = useState("");\n  const [categoriesList, setCategoriesList] = useState<{ _id: string, name: string }[]>([]);'
);

// 3. fetchCategories
text = text.replace(
  '  useEffect(() => {\r\n    fetchBlogs();\r\n  }, []);',
  `  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/home-categories");
      const data = await res.json();
      if (data.success && data.categories) {
        const uniqueCategories = Array.from(new Set(data.categories.map((c) => c.name)))
          .map(name => data.categories.find((c) => c.name === name));
        setCategoriesList(uniqueCategories);
      }
    } catch (error) {
      console.error(error);
    }
  };`
);
text = text.replace(
  '  useEffect(() => {\n    fetchBlogs();\n  }, []);',
  `  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/home-categories");
      const data = await res.json();
      if (data.success && data.categories) {
        const uniqueCategories = Array.from(new Set(data.categories.map((c) => c.name)))
          .map(name => data.categories.find((c) => c.name === name));
        setCategoriesList(uniqueCategories);
      }
    } catch (error) {
      console.error(error);
    }
  };`
);

// 4. Category dropdown
const oldSelect = `<select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-2 rounded">
                <option value="Betten">Betten</option>
                <option value="Sofas">Sofas</option>
                <option value="Stühle">Stühle</option>
                <option value="Terrasse">Terrasse</option>
                <option value="Balkon">Balkon</option>
              </select>`;
const oldSelectCrLf = `<select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-2 rounded">\r\n                <option value="Betten">Betten</option>\r\n                <option value="Sofas">Sofas</option>\r\n                <option value="Stühle">Stühle</option>\r\n                <option value="Terrasse">Terrasse</option>\r\n                <option value="Balkon">Balkon</option>\r\n              </select>`;
const newSelect = `<select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-2 rounded">
                {categoriesList.length === 0 && <option value="Betten">Betten</option>}
                {categoriesList.map((cat) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>`;
text = text.replace(oldSelect, newSelect);
text = text.replace(oldSelectCrLf, newSelect);

// 5. Hero Image size
text = text.replace(
  '<label className="block text-sm font-medium text-gray-700 mb-1">Haupt-Bild (Hero Image)</label>',
  '<label className="block text-sm font-medium text-gray-700 mb-1">Haupt-Bild (Hero Image) <span className="text-gray-400 font-normal text-xs ml-2">(Empfohlen: 1920x600px oder 16:9 Format)</span></label>'
);

// 6. Intro RichText
const oldIntro = `<textarea value={intro} onChange={(e) => setIntro(e.target.value)} className="w-full border p-2 rounded h-24" />`;
const newIntro = `<div className="bg-white"><ReactQuill theme="snow" value={intro} onChange={setIntro} className="h-64 mb-12" /></div>`;
text = text.replace(oldIntro, newIntro);
text = text.replace(
  '<label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung / Intro (Descriptions)</label>',
  '<label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung / Intro (Descriptions) <span className="text-gray-400 font-normal text-xs ml-2">(HTML / Rich Text)</span></label>'
);

// 7. Section content RichText
const oldSectionContent = `<textarea value={section.content} onChange={(e) => handleUpdateSection(index, "content", e.target.value)} className="w-full border p-2 rounded h-24" />`;
const oldSectionContentCrLf = `<textarea value={section.content} onChange={(e) => handleUpdateSection(index, \"content\", e.target.value)} className=\"w-full border p-2 rounded h-24\" />`;
const newSectionContent = `<div className="bg-white"><ReactQuill theme="snow" value={section.content} onChange={(val) => handleUpdateSection(index, "content", val)} className="h-64 mb-12" /></div>`;
text = text.replace(oldSectionContent, newSectionContent);
text = text.replace(oldSectionContentCrLf, newSectionContent);
text = text.replace(
  '<label className="block text-sm font-medium text-gray-700 mb-1">Text / Inhalt der Sektion</label>',
  '<label className="block text-sm font-medium text-gray-700 mb-1">Text / Inhalt der Sektion <span className="text-gray-400 font-normal text-xs ml-2">(HTML / Rich Text)</span></label>'
);

fs.writeFileSync('src/app/admin/blog/page.tsx', text);
