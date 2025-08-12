import Layout from "../layout";
import { Button } from "../../src/components/Button";

export default function WebsiteEdit() {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <Layout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "12px" }}>
        <section style={{ display: "flex", flexDirection: "column", backgroundColor: "white" }}>
          {/* Header */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            padding: "12px 16px", 
            backgroundColor: "#1e3a8a",
            color: "white"
          }}>
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>
              Update Website
            </span>
            <Button 
              variant="secondary" 
              onClick={handleBack}
              style={{ cursor: "pointer" }}
            >
              Back
            </Button>
          </div>
          {/* Form will go here */}
        </section>
      </div>
    </Layout>
  );
} 