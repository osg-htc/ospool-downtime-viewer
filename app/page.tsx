import Image from "next/image";
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import { XMLParser } from "fast-xml-parser";
import DowntimeTable from "./downtime-table";
import { DowntimesRespose, ResourceGroupsResponse } from "./interfaces";
import React from "react";


export default async function Home() {
  const res = await fetch('https://topology.opensciencegrid.org/rgdowntime/xml?downtime_attrs_showpast=45')
  const data = await res.text()
  const parsedData = new XMLParser().parse(data) as DowntimesRespose

  const siteRes = await fetch('https://topology.opensciencegrid.org/rgsummary/xml')
  const siteData = await siteRes.text()
  const parsedSiteData = new XMLParser().parse(siteData) as ResourceGroupsResponse

  return (
    <React.Fragment>
      <header className="bg-gray-800 p-4 font-semibold drop-shadow-md">
        <div><span className="text-gray-200 text-lg">Topology Downtimes</span></div>
      </header>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="width-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <DowntimeTable downtimes={parsedData} resourceGroups={parsedSiteData} />
        </main>
      </div>
    </React.Fragment>
  );
}
