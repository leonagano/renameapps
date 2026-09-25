import { ImageResponse } from "next/og";

async function loadMarkerFont(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap"
    );
    const css = await cssRes.text();
    const match = css.match(/src: url\(([^)]+)\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? "This App";
  const honest = url.searchParams.get("honest") ?? "Nobody's Roasted This Yet";
  const from = url.searchParams.get("from") ?? "#ef4444";
  const to = url.searchParams.get("to") ?? "#7c2d12";

  const fontData = await loadMarkerFont();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #ff5252 0%, transparent 40%), radial-gradient(circle at 80% 30%, #7c4dff 0%, transparent 50%), radial-gradient(circle at 50% 80%, #00e676 0%, transparent 45%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: 40,
            backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            marginBottom: 40,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            color: "#f87171",
            fontFamily: fontData ? "Marker" : undefined,
            textAlign: "center",
            maxWidth: 900,
            marginBottom: 20,
          }}
        >
          &ldquo;{honest}&rdquo;
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.7)" }}>
          was {name}
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 32,
            right: 40,
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
          }}
        >
          renameapps.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData ? [{ name: "Marker", data: fontData, style: "normal" }] : undefined,
    }
  );
}
