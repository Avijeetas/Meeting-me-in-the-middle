import React from "react";
import { Card } from "./Card";
import { friend } from "../definitions";
export function CardGrid({ requests, fetchPendingRequests }: {requests: any, fetchPendingRequests: any}) {
  // console.log(requests)
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 px-3">

        {requests?.map((request : friend) => (
          <Card key={request.id} request={request} fetchPendingRequests={fetchPendingRequests}/>
        ))} 

  
        {/* Render "See All" only if there are more than 5 cards */}
        {/* {requests.length > 5 && (
          <Link
            href="/see-all"
            className="mt-4 flex items-center rounded-smp-4 text-black-500 hover:text-blue-700" 
          >
            See All
          </Link>
        )} */}
      </div>
      
    );
  }