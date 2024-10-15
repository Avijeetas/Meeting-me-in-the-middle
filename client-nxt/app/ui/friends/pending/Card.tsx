"use client";
import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/router';
import { addFriend, deleteFriend } from '@/app/lib/friends/actions';
import { friend } from "../definitions";
import { useUser } from '@/app/UserContext';
import { UserAvatar } from "../../userAvatar";
export function Card({request} : friend) {
    const { currentUser } = useUser();

    const currentUserId = currentUser?.uid || "";
    const [loading, setLoading] = useState(false);
    
    const handleConnect = async (requestId: string) => {
      setLoading(true);
      try {
       

           await addFriend(requestId);
    
          console.log('Friend request created successfully:', requestId);
          
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    };
    const handleCancel = async (requestId: string) => {
      setLoading(true);
      try {
    
        await deleteFriend(requestId);
    
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    };
    return (
      
      <div className="rounded-xl bg-blue-50 p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-start">
        {/* Avatar Section */}
        <UserAvatar firstName={request.sender_id!==currentUserId ? request.sender_name : request.recipient_name} lastName={request.sender_id!==currentUserId ? request.sender_name : request.recipient_name} />

        {/* Name, Title and Address Section */}
        <div className="ml-4">
          <h3 className="text-sm font-medium">{request.sender_id!==currentUserId ? request.sender_name : request.recipient_name}</h3>
          <p className="text-xs text-gray-500">{request.streetAddress+", "+request.city+", "+request.state+", "+request.zipCode}</p>
        </div>
      </div>

      

      {/* Connect and Deny Buttons */}
      <div className="mt-4 flex justify-end">
        <button 
        
          onClick={() => handleConnect(request.id)}
          disabled={loading}
          className="w-20 mr-2 rounded-lg bg-green-500 text-white py-2 hover:bg-green-600">
          {loading ? 'Connecting...' : 'Connect'}
        </button>
        <button 
          onClick={() => handleCancel(request.id)}
          disabled={loading}
          className="w-20 ml-2 rounded-lg bg-red-500 text-white py-2 hover:bg-red-600">
          {loading ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>
    </div>
    );
  }
  