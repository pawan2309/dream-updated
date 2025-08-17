import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../layout";
import { Button } from "../../../src/components/Button";

interface CasinoDetails {
  eventId: string;
  name: string;
  shortName: string;
  betStatus: string;
  minStake: number;
  maxStake: number;
  streamingId?: string;
  dataUrl?: string;
  resultUrl?: string;
}

export default function CasinoDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [casino, setCasino] = useState<CasinoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    eventId: "",
    cacheURL: "https://casinoapi.trovetown.co/v2/api/casinoData?casinoType=teen20",
    socketURL: "https://casinoapi.trovetown.co",
    videoUrl1: "https://casinostream.trovetown.co/route/?id=3030",
    videoUrl2: "https://stream.1ex99.in/casinoVideo/video?id=3030",
    videoUrl3: "",
    fetchData: "Select fetch Type",
    videoUrlType: "1",
    minStake: "100",
    maxStake: "25000",
    betStatus: true,
    casinoStatus: true,
    errorMessage: "Game is under maintenance",
    oddsDifference: "0.01"
  });

  useEffect(() => {
    if (id) {
      fetchCasinoDetails(id as string);
    }
  }, [id]);

  const fetchCasinoDetails = async (casinoId: string) => {
    try {
      const response = await fetch(`/api/casino`);
      if (response.ok) {
        const data = await response.json();
        const casinoData = data.data.find((c: CasinoDetails) => c.streamingId === casinoId);
        if (casinoData) {
          setCasino(casinoData);
          setFormData(prev => ({
            ...prev,
            name: casinoData.name,
            shortName: casinoData.shortName,
            eventId: casinoData.streamingId || "",
            minStake: casinoData.minStake?.toString() || "100",
            maxStake: casinoData.maxStake?.toString() || "25000",
            betStatus: casinoData.betStatus === "yes" || casinoData.betStatus === "ON"
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching casino details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <span>Loading casino details...</span>
        </div>
      </Layout>
    );
  }

  if (!casino) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <span>Casino not found</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col flex-1 overflow-y-auto h-full">
        <main className="relative flex-1">
          <div className="2xl:px-28 lg:px-5 sm:p-5 w-full">
            <div className="mx-auto max-w-screen-3xl md:py-3 px-2">
              <section className="flex-col col-span-6 bg-white">
                <div className="flex justify-between items-center py-3 px-4 bg-dark-blue">
                  <span className="text-xl lg:text-2xl text-center text-white capitalize">Update Casino</span>
                  <button className="rounded-none cursor-pointer btn btn-type" type="submit" onClick={handleBack}>Back</button>
                </div>
                
                <div className="w-full py-2 px-3 space-y-5">
                  <div className="grid grid-col-1 lg:grid-cols-2 gap-4">
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Name :</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="border p-2 focus:outline-none text-sm text-black w-full" 
                          type="text" 
                          name="name" 
                          disabled 
                          value={formData.name}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Short Name</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          name="shortName" 
                          disabled 
                          value={formData.shortName}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Event Id</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          name="eventId" 
                          value={formData.eventId}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Cache Url</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          name="cacheURL" 
                          value={formData.cacheURL}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Socket Url</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          name="socketURL" 
                          value={formData.socketURL}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">VideoUrl1</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          name="videoUrl1" 
                          value={formData.videoUrl1}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">VideoUrl2</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          name="videoUrl2" 
                          value={formData.videoUrl2}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">VideoUrl3</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          name="videoUrl3" 
                          value={formData.videoUrl3}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">FetchData Type :</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <select 
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 cursor-pointer" 
                          id="fetchData" 
                          name="fetchData"
                          value={formData.fetchData}
                          onChange={handleInputChange}
                        >
                          <option>Select fetch Type</option>
                          <option value="socket">Socket</option>
                          <option value="cache">Cache</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">videoUrlType :</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <select 
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 cursor-pointer" 
                          id="videoUrlType" 
                          name="videoUrlType"
                          value={formData.videoUrlType}
                          onChange={handleInputChange}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Min Stake</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          id="minStake" 
                          name="minStake" 
                          value={formData.minStake}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Max Stake</label>
                      </div>
                      <div className="flex flex-col w-full">
                        <input 
                          className="w-full p-2 text-sm text-black border focus:outline-none" 
                          type="text" 
                          id="maxStake" 
                          name="maxStake" 
                          value={formData.maxStake}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-full lg:w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Bet Status :</label>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-center w-20 h-full rounded-full px-1 bg-green-500">
                          <label htmlFor="betStatus" className="flex items-center cursor-pointer relative">
                            <input 
                              type="checkbox" 
                              id="betStatus" 
                              className="sr-only"
                              checked={formData.betStatus}
                              onChange={() => handleCheckboxChange('betStatus')}
                            />
                            <div className="py-1 block relative w-[84px] h-[20px] text-center rounded-full before:absolute before:bg-white before:w-[20px] before:h-[20px] before:text-center before:rounded-full before:transition-all before:duration-500 before:left-14"></div>
                            <span className="absolute top-1 transform text-white text-sm transition-all duration-500 ml-3">
                              {formData.betStatus ? 'On' : 'Off'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:flex items-center lg:space-x-2">
                      <div className="w-full lg:w-2/5">
                        <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Casino Status :</label>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-center w-20 h-full rounded-full px-1 bg-green-500">
                          <label htmlFor="casinoStatus" className="flex items-center cursor-pointer relative">
                            <input 
                              type="checkbox" 
                              id="casinoStatus" 
                              className="sr-only"
                              checked={formData.casinoStatus}
                              onChange={() => handleCheckboxChange('casinoStatus')}
                            />
                            <div className="py-1 block relative w-[84px] h-[20px] text-center rounded-full before:absolute before:bg-white before:w-[20px] before:h-[20px] before:text-center before:rounded-full before:transition-all before:duration-500 before:left-14"></div>
                            <span className="absolute top-1 transform text-white text-sm transition-all duration-500 ml-3">
                              {formData.casinoStatus ? 'On' : 'Off'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <div className="w-full">
                      <h1 className="text-xl font-semibold">Setting</h1>
                    </div>
                    <div className="grid grid-col-1 lg:grid-cols-2 gap-4 w-full">
                      <div className="md:flex items-center lg:space-x-2">
                        <div className="w-2/5">
                          <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Error Message :</label>
                        </div>
                        <div className="flex flex-col w-full">
                          <input 
                            className="border p-2 focus:outline-none text-sm text-black w-full" 
                            type="text" 
                            name="errorMessage" 
                            value={formData.errorMessage}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="md:flex items-center lg:space-x-2">
                        <div className="w-2/5">
                          <label className="block text-[14px] font-medium text-black/70 md:text-left capitalize">Odds Difference</label>
                        </div>
                        <div className="flex flex-col w-full">
                          <input 
                            className="w-full p-2 text-sm text-black border focus:outline-none" 
                            type="text" 
                            name="oddsDifference" 
                            value={formData.oddsDifference}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center bg-dark-blue rounded px-3 p-1">
                      <div className="text-white">Odds Setting</div>
                      <button className="rounded focus:outline-none p-2">
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="text-white font-bold text-sm" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                    <div className="overflow-hidden px-1">
                      <div className="max-w-full overflow-auto">
                        <div className="inline-block min-w-full">
                          <table className="w-full text-white">
                            <thead>
                              <tr className="bg-dark-blue text-[14px] font-medium text-white whitespace-nowrap">
                                <th className="p-2">Team Name</th>
                                <th className="p-2">Selection Id</th>
                                <th className="p-2">Rate</th>
                                <th className="p-2">Converted Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-[14px] font-medium text-black/70">
                                <td className="px-2 py-1">Player A</td>
                                <td className="px-2 py-1">1</td>
                                <td className="px-2 py-1">0</td>
                                <td className="px-2 py-1">
                                  <input className="w-fit p-1 text-[13px] text-gray-800/70 border focus:outline-none capitalize" type="number" id="1" name="convertedRate" placeholder="" value="" />
                                </td>
                                <td className="px-2 py-1">
                                  <button className="rounded cursor-pointer btn btn-type" type="button">Submit</button>
                                </td>
                              </tr>
                              <tr className="text-[14px] font-medium text-black/70">
                                <td className="px-2 py-1">Pair plus A</td>
                                <td className="px-2 py-1">2</td>
                                <td className="px-2 py-1">0</td>
                                <td className="px-2 py-1">
                                  <input className="w-fit p-1 text-[13px] text-gray-800/70 border focus:outline-none capitalize" type="number" id="2" name="convertedRate" placeholder="" value="" />
                                </td>
                                <td className="px-2 py-1">
                                  <button className="rounded cursor-pointer btn btn-type" type="button">Submit</button>
                                </td>
                              </tr>
                              <tr className="text-[14px] font-medium text-black/70">
                                <td className="px-2 py-1">Player B</td>
                                <td className="px-2 py-1">3</td>
                                <td className="px-2 py-1">0</td>
                                <td className="px-2 py-1">
                                  <input className="w-fit p-1 text-[13px] text-gray-800/70 border focus:outline-none capitalize" type="number" id="3" name="convertedRate" placeholder="" value="" />
                                </td>
                                <td className="px-2 py-1">
                                  <button className="rounded cursor-pointer btn btn-type" type="button">Submit</button>
                                </td>
                              </tr>
                              <tr className="text-[14px] font-medium text-black/70">
                                <td className="px-2 py-1">Pair plus B</td>
                                <td className="px-2 py-1">4</td>
                                <td className="px-2 py-1">0</td>
                                <td className="px-2 py-1">
                                  <input className="w-fit p-1 text-[13px] text-gray-800/70 border focus:outline-none capitalize" type="number" id="4" name="convertedRate" placeholder="" value="" />
                                </td>
                                <td className="px-2 py-1">
                                  <button className="rounded cursor-pointer btn btn-type" type="button">Submit</button>
                                </td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={4} className="px-2 py-1 text-right">
                                  <button className="rounded cursor-pointer btn btn-type" type="button">Submit</button>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-3 pb-4 space-x-5">
                    <button className="rounded-none cursor-pointer btn btn-type" type="button">Submit</button>
                  </div>
                  
                  <div className="details">
                    <div className="w-full relative md:text-sm text-[10px] bg-white h-[250px]">
                      <iframe 
                        src={`https://casinostream.trovetown.co/route/?id=${formData.eventId}`}
                        title="Casino Stream" 
                        className="w-[100%] lg:w-[400px] h-[250px]"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
