import React, { useState } from "react";
import Layout from "../layout";
import { Button } from "../../src/components/Button";

interface Website {
  id: string;
  name: string;
  url: string;
}

export default function WebsiteSettings() {
  const [selectedWebsiteType, setSelectedWebsiteType] = useState("nonDeletedWeb");
  const [websites, setWebsites] = useState<Website[]>([]);

  const handleWebsiteTypeChange = (type: string) => {
    setSelectedWebsiteType(type);
    // TODO: Fetch websites based on type from API
    console.log("Filtering by website type:", type);
  };

  const handleAddWebsite = () => {
    console.log("Adding new website");
    // TODO: Open add website modal/form
  };

  const handleEditWebsite = (website: Website) => {
    console.log("Editing website:", website);
    // TODO: Open edit website modal/form
  };

  const handleDeleteWebsite = (website: Website) => {
    console.log("Deleting website:", website);
    // TODO: Confirm and delete website
  };

  const handleBack = () => {
    console.log("Going back");
    // TODO: Navigate back
  };

  return (
    <Layout>
      <div style={{ 
        background: "#fff", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        margin: "16px"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "#17445A",
          color: "#fff",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px"
        }}>
          <span style={{ fontSize: "20px", fontWeight: "600" }}>
            Website List
          </span>
          <Button
            variant="secondary"
            size="medium"
            onClick={handleBack}
          >
            Back
          </Button>
        </div>

        {/* Controls */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            minWidth: "200px",
            flex: "1"
          }}>
            <label style={{ 
              fontSize: "12px", 
              fontWeight: "600", 
              marginBottom: "4px",
              whiteSpace: "nowrap"
            }}>
              Select WebsiteType
            </label>
            <select
              value={selectedWebsiteType}
              onChange={(e) => handleWebsiteTypeChange(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "12px",
                fontWeight: "600",
                border: "1px solid #9ca3af",
                borderRadius: "2px",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              <option value="nonDeletedWeb">Non-Deleted Website</option>
              <option value="deletedWeb">Deleted Website</option>
            </select>
          </div>

          <div style={{ minWidth: "150px" }}>
            <Button
              variant="primary"
              size="medium"
              onClick={handleAddWebsite}
              style={{ width: "100%" }}
            >
              Add Website
            </Button>
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "none"
            }}>
              <thead>
                <tr style={{
                  background: "#17445A",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  <th style={{ 
                    padding: "8px 24px", 
                    textAlign: "left",
                    whiteSpace: "nowrap"
                  }}>
                    #
                  </th>
                  <th style={{ 
                    padding: "8px 24px", 
                    textAlign: "left",
                    whiteSpace: "nowrap"
                  }}>
                    Name
                  </th>
                  <th style={{ 
                    padding: "8px 24px", 
                    textAlign: "left",
                    whiteSpace: "nowrap"
                  }}>
                    Url
                  </th>
                  <th style={{ 
                    padding: "8px 24px", 
                    textAlign: "left",
                    whiteSpace: "nowrap"
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {websites.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{
                      textAlign: "center",
                      padding: "24px",
                      fontSize: "14px",
                      color: "#6b7280",
                      background: "#fff",
                      borderBottom: "1px solid rgba(0,0,0,0.1)"
                    }}>
                      No websites available. Add a website to get started.
                    </td>
                  </tr>
                ) : (
                  websites.map((website, index) => (
                    <tr key={website.id} style={{
                      background: "#fff",
                      borderBottom: "1px solid rgba(0,0,0,0.1)"
                    }}>
                      <td style={{ 
                        padding: "12px 24px", 
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#000",
                        whiteSpace: "nowrap"
                      }}>
                        {index + 1}
                      </td>
                      <td style={{ 
                        padding: "12px 24px", 
                        fontSize: "14px",
                        color: "#000",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: "200px"
                      }} title={website.name}>
                        {website.name}
                      </td>
                      <td style={{ 
                        padding: "12px 24px", 
                        fontSize: "14px",
                        color: "#000",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: "200px"
                      }} title={website.url}>
                        {website.url}
                      </td>
                      <td style={{ 
                        padding: "8px 24px",
                        fontSize: "14px",
                        color: "#000",
                        whiteSpace: "nowrap"
                      }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleEditWebsite(website)}
                            style={{ 
                              fontSize: "12px", 
                              padding: "6px 10px"
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDeleteWebsite(website)}
                            style={{ 
                              fontSize: "12px", 
                              padding: "6px 10px"
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 