import Image from "next/image";
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import { XMLParser } from "fast-xml-parser";
import DowntimeTable from "./downtime-table";
import { DowntimesRespose, ResourceGroupsResponse } from "./interfaces";
import React from "react";

export const revalidate = 3600

export default async function Home() {
  const res = await fetch('https://topology.opensciencegrid.org/rgdowntime/xml?downtime_attrs_showpast=45')
  const data = await res.text()
  const parsedData = new XMLParser().parse(data) as DowntimesRespose
  console.log(parsedData)

  const siteRes = await fetch('https://topology.opensciencegrid.org/rgsummary/xml')
  const siteData = await siteRes.text()
  const parsedSiteData = new XMLParser().parse(siteData) as ResourceGroupsResponse

  return (
    <React.Fragment>
      <header className="bg-gray-800 p-4 font-semibold drop-shadow-md">
        <div><span className="text-gray-200 text-lg">Topology Downtimes</span></div>
      </header>
      <div className="flex flex-column justify-start min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <DowntimeTable downtimes={parsedData} resourceGroups={parsedSiteData} />
        <main className="width-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        </main>
      </div>
    </React.Fragment>
  );
}
