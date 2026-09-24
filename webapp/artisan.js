#!node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith("--"));
const params = flags.reduce((acc, flag) => {
  const [key, value] = flag.slice(2).split("=");
  acc[key] = value || true;
  return acc;
}, {});
// --female
const gender = params.female === true ? "a" : "o";
// --plural=ões
// const plural = params.plural || `${gender}s`;
const Resource = args[0];
const ResourceName = args[1];
// const ResourceNamePlural = ResourceName.slice((plural.length - 1) * -1, 0);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (Resource === undefined || ResourceName === undefined) {
  console.info("Resource and ResourceName must be defined");
  process.exit();
}

// const snake_case_resource = Resource.split(/(?=[A-Z])/).join('_').toLowerCase();
// const snake_case_resource_name = ResourceName.split(/(?=[A-Z])/).join('_').toLowerCase();
const camelCaseResource = Resource.split("").reduce((t, v, k) => t + (k === 0 ? v.toLowerCase() : v), "");
const kebabCaseResource = camelCaseResource.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

const camelCaseResourceName = ResourceName.split("").reduce((t, v, k) => t + (k === 0 ? v.toLowerCase() : v), "");
const kebabCaseResourceName = camelCaseResourceName
  .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
  .replace(/ +/g, "-")
  .toLowerCase();

const appPath = `${__dirname}/src`;
const stubsPath = `${__dirname}/stubs`;
const routesPath = `${appPath}/routes/_protected/${kebabCaseResourceName}s`;
const componentsPath = `${appPath}/components/resources/${kebabCaseResource}`;
const idName = `${camelCaseResource}Id`;
const filesToGenerate = {
  Service: {
    filepath: `${appPath}/services/${kebabCaseResource}-service.ts`,
    stub: "Service.stub",
  },
  Form: {
    filepath: `${componentsPath}/form.tsx`,
    stub: "Form.stub",
  },
  Create: {
    filepath: `${routesPath}/novo.tsx`,
    stub: "Create.stub",
  },
  Edit: {
    filepath: `${routesPath}/$${idName}/alterar.tsx`,
    stub: "Edit.stub",
  },
  List: {
    filepath: `${routesPath}/index.tsx`,
    stub: "List.stub",
  },
  // Schema: {
  //   filepath: `${appPath}/schemas/${Resource}CreateOrUpdateSchema.ts`,
  //   stub: 'Schema.stub',
  // },
};

if (!fs.existsSync(componentsPath)) {
  fs.mkdirSync(componentsPath);
}
if (!fs.existsSync(routesPath)) {
  fs.mkdirSync(routesPath);
}
if (!fs.existsSync(`${routesPath}/$${idName}`)) {
  fs.mkdirSync(`${routesPath}/$${idName}`);
}

async function canCreateFile(filepath) {
  const filename = path.basename(filepath);
  if (!fs.existsSync(filepath)) {
    return true;
  }
  console.info(`File ${filename} already exists`);
  return false;
}
function generateFile(info) {
  if (!canCreateFile(info.filepath)) {
    return false;
  }
  let data = fs.readFileSync(`${stubsPath}/${info.stub}`, "utf8");
  data = data
    .replace(/\{\{DummyResource\}\}/g, Resource)
    .replace(/\{\{dummy-resource\}\}/g, kebabCaseResource)
    .replace(/\{\{dummyResource\}\}/g, camelCaseResource)
    .replace(/\{\{DummyResourceName\}\}/g, ResourceName)
    .replace(/\{\{dummy-resource-name\}\}/g, kebabCaseResourceName)
    .replace(/\{\{dummyresourcename\}\}/g, ResourceName.toLocaleLowerCase())
    .replace(/\{\{DUMMYRESOURCENAME\}\}/g, ResourceName.toLocaleUpperCase())
    .replace(/\{\{gender\}\}/g, gender)
    .replace(/\{\{idName\}\}/g, idName);
  fs.writeFileSync(info.filepath, data, "utf8");
  return true;
}

for (const key in filesToGenerate) {
  generateFile(filesToGenerate[key]);
}
