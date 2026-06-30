import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const electronAppPath = path.join(projectRoot, "node_modules/electron/dist/Electron.app");
const releaseRoot = path.join(projectRoot, "release");

const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
const productName = packageJson.productName ?? "SNS Client";
const packageName = packageJson.name ?? "sns-client-desktop";
const version = packageJson.version ?? "0.0.0";
const bundleId = "com.dolphilia.sns-client";
const arch = process.arch;
const appName = `${productName}.app`;
const appOutDir = path.join(releaseRoot, "mac", appName);
const artifactsDir = path.join(releaseRoot, "artifacts");
const artifactBaseName = `${packageName}-${version}-mac-${arch}`;
const zipPath = path.join(artifactsDir, `${artifactBaseName}.zip`);
const dmgPath = path.join(artifactsDir, `${artifactBaseName}.dmg`);

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyRequiredAppFiles(resourcesAppDir) {
  await fs.mkdir(resourcesAppDir, { recursive: true });
  await fs.cp(path.join(projectRoot, "dist"), path.join(resourcesAppDir, "dist"), {
    recursive: true,
  });
  await fs.cp(
    path.join(projectRoot, "dist-electron"),
    path.join(resourcesAppDir, "dist-electron"),
    { recursive: true }
  );

  const runtimePackageJson = {
    name: packageName,
    productName,
    version,
    type: packageJson.type,
    main: packageJson.main,
  };
  await fs.writeFile(
    path.join(resourcesAppDir, "package.json"),
    `${JSON.stringify(runtimePackageJson, null, 2)}\n`,
    "utf8"
  );
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    ...options,
  });
}

async function updateInfoPlist(appDir) {
  const plistPath = path.join(appDir, "Contents", "Info.plist");
  run("plutil", ["-replace", "CFBundleName", "-string", productName, plistPath]);
  run("plutil", ["-replace", "CFBundleDisplayName", "-string", productName, plistPath]);
  run("plutil", ["-replace", "CFBundleExecutable", "-string", productName, plistPath]);
  run("plutil", ["-replace", "CFBundleIdentifier", "-string", bundleId, plistPath]);
  run("plutil", ["-replace", "CFBundleShortVersionString", "-string", version, plistPath]);
  run("plutil", ["-replace", "CFBundleVersion", "-string", version, plistPath]);
  run("plutil", [
    "-replace",
    "LSApplicationCategoryType",
    "-string",
    "public.app-category.social-networking",
    plistPath,
  ]);
}

async function renameExecutable(appDir) {
  const macosDir = path.join(appDir, "Contents", "MacOS");
  const source = path.join(macosDir, "Electron");
  const target = path.join(macosDir, productName);
  if (await pathExists(source)) {
    await fs.rename(source, target);
  }
}

async function createZip() {
  await fs.rm(zipPath, { force: true });
  run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appOutDir, zipPath]);
}

async function createDmg() {
  await fs.rm(dmgPath, { force: true });
  run("hdiutil", [
    "create",
    "-volname",
    productName,
    "-srcfolder",
    appOutDir,
    "-ov",
    "-format",
    "UDZO",
    dmgPath,
  ]);
}

function signApp() {
  run("codesign", ["--force", "--deep", "--sign", "-", appOutDir]);
}

async function main() {
  if (process.platform !== "darwin") {
    throw new Error("package:mac can only run on macOS.");
  }

  if (!(await pathExists(electronAppPath))) {
    throw new Error(`Electron.app was not found: ${electronAppPath}`);
  }

  await fs.rm(path.join(releaseRoot, "mac"), { recursive: true, force: true });
  await fs.mkdir(path.join(releaseRoot, "mac"), { recursive: true });
  await fs.mkdir(artifactsDir, { recursive: true });

  run("ditto", [electronAppPath, appOutDir]);
  await renameExecutable(appOutDir);
  await updateInfoPlist(appOutDir);

  const resourcesAppDir = path.join(appOutDir, "Contents", "Resources", "app");
  await fs.rm(resourcesAppDir, { recursive: true, force: true });
  await copyRequiredAppFiles(resourcesAppDir);

  signApp();
  await createZip();
  await createDmg();

  console.log("");
  console.log("Created macOS distribution artifacts:");
  console.log(`- ${appOutDir}`);
  console.log(`- ${zipPath}`);
  console.log(`- ${dmgPath}`);
}

await main();
