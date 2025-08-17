import React from 'react';
import Layout from '../layout';

const MatchEditPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-64 bg-dark-blue text-white">
        <div className="p-4">
          <h2 className="text-xl font-bold">BetList</h2>
        </div>
        <nav className="mt-4">
          <div className="px-4 py-2 text-sm text-gray-300 cursor-pointer hover:bg-blue-800">
            <div className="flex items-center justify-between">
              <span>Menu Item 1</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="px-4 py-2 text-sm text-gray-300 cursor-pointer hover:bg-blue-800">
            <div className="flex items-center justify-between">
              <span>Menu Item 2</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="px-4 py-2 text-sm text-gray-300 cursor-pointer hover:bg-blue-800">
            <div className="flex items-center justify-between">
              <span>Menu Item 3</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="flex justify-between items-center py-3 px-4 bg-dark-blue rounded-t-lg">
              <span className="text-xl lg:text-2xl text-center text-white capitalize">Update Match</span>
              <button className="rounded-none cursor-pointer btn btn-type text-white px-4 py-2 border border-white hover:bg-white hover:text-dark-blue transition-colors" type="submit">Back</button>
            </div>
            
            {/* Form Content */}
            <div className="w-full py-2 px-3">
              <div className="grid grid-col-1 lg:grid-cols-2 gap-4 py-2">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Match Name :</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="border p-2 focus:outline-none text-sm text-black w-full" type="text" name="matchName" defaultValue=" The Hundred Cup" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Score Iframe</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="scoreIframe" defaultValue="https://score.trovetown.co/socket-iframe-5/crickexpo/29510526" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Event Id</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="eventId" defaultValue="29510526" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Sport Id</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="sportId" defaultValue="4" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Priority</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="priority" defaultValue="" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">TV Id</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="tvId" defaultValue="" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Cache Url</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="cacheUrl" defaultValue="https://vigcache.trovetown.co/v2/api/oddsDataNew?market_id=1.245" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5 flex justify-between">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">TV Url</label>
                      <button className="rounded-none cursor-pointer bg-green-500 text-white px-3 py-1 text-sm hover:bg-green-600 transition-colors" type="button">Set Url</button>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="tvUrl" defaultValue="https://tv.tresting.com/?eventid=29510526" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Status :</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 cursor-pointer" id="status" name="status">
                        <option value="INPLAY">Inplay</option>
                        <option value="ABONDED">Abandoned</option>
                        <option value="REMOVE">Remove</option>
                        <option value="CANCEL">Cancel</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="UPCOMING">Upcoming</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Bookmaker Range</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="bookmakerRange" defaultValue="" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Team2 Image :</label>
                    </div>
                    <div className="flex space-x-2 items-start">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="file" name="team2Img" />
                      <img alt="team2Img" className="h-16 w-32 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Series Name</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="seriesName" defaultValue="The Hundred" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Score Iframe2</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="scoreIframe2" defaultValue="https://card.hr08bets.in/ap/getScoreData?event_id=29510526" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Series Id</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="seriesId" defaultValue="12267948" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Market Id</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="marketId" defaultValue="1.245954373" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Match Date</label>
                    </div>
                    <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="matchDate" defaultValue="05-08-2025 23:00:00" />
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Socket Url</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="socketUrl" defaultValue="https://vigcache.trovetown.co/" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">OtherMarketCacheUrl</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="otherMarketCacheUrl" defaultValue="https://vigcache.trovetown.co/v2/api/dataByEventid?eventId=295105:" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Match Type :</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 cursor-pointer" id="matchType" name="matchType">
                        <option>Select Match Type</option>
                        <option value="One-Day">One Day</option>
                        <option value="T-20">T 20</option>
                        <option value="T-10">T 10</option>
                        <option value="Test">Test</option>
                        <option value="Cup">Cup</option>
                        <option value="20-20 OR 50-50">SA20</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Bet Delay Time</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="betDelayTime" defaultValue="" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Team1 Image :</label>
                    </div>
                    <div className="flex space-x-2 items-start">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="file" name="team1Img" />
                      <img alt="team1Img" className="h-16 w-32 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="md:flex items-center lg:space-x-2">
                    <div className="w-2/5">
                      <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Notification :</label>
                    </div>
                    <div className="flex flex-col w-full">
                      <input className="w-full p-2 text-sm text-black border focus:outline-none" type="text" name="notification" defaultValue="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchEditPage;
