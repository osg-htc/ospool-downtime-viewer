import { DowntimesRespose, ResourceGroupsResponse } from "@/app/interfaces"
import { XMLParser } from "fast-xml-parser"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const siteRes = await fetch('https://topology.opensciencegrid.org/rgsummary/xml')
    const siteData = await siteRes.text()
    const parsedSiteData = new XMLParser().parse(siteData) as ResourceGroupsResponse
    return NextResponse.json(parsedSiteData)
}
