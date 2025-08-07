import { DowntimesRespose } from "@/app/interfaces"
import { XMLParser } from "fast-xml-parser"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const topologyRes = await fetch('https://topology.opensciencegrid.org/rgdowntime/xml?downtime_attrs_showpast=45')
    const data = await topologyRes.text()
    const parsedData = new XMLParser().parse(data) as DowntimesRespose
    return NextResponse.json(parsedData)
}
