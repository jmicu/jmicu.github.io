const oldestAllowed = "1900-01-01";
const newestAllowed = "2020-06-31";
const eligibleContractors = [];
const allRegistrationNumbers = [];
const pageStart = 3;
const pageEnd = 8;
const currentPage = 1;
const pageInterval = 1;

const today = new Date();
const time =
  today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();

describe(
  "Get Active Contractors with Earliest Reg Date of " + oldestAllowed,
  () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    before("wrap", () => {
      const url =
        "https://cadir.secure.force.com/ContractorSearch?startDate=" +
        oldestAllowed;
      cy.visit(url);

      for (let j = 1; j < pageStart; j++) {
        cy.log("Fast-forwarding to next page...");
        cy.get("#totalResultCount").should("be.visible");
        cy.get("#next").click();
      }
      cy.log(allRegistrationNumbers);
    });

    after("write to the file", () => {
      cy.log(allRegistrationNumbers);
      cy.writeFile(
        "results/myCADIR_" + pageStart + "-" + pageEnd + "_" + time + ".json",
        eligibleContractors,
        {
          flag: "a+",
        }
      );
    });

    const loopCount = (pageEnd - pageStart - 1) / pageInterval;

    // starts the parent for loop
    for (let h = 0; h <= loopCount; h++) {
      const loopSet = h * pageInterval;
      const loopStart = pageStart + loopSet;
      const loopEnd = loopStart + pageInterval - 1;

      it(
        "Test loop #" +
          (h + 1) +
          "; searching pages " +
          loopStart +
          "-" +
          loopEnd +
          ":",
        () => {
          for (let i = loopStart; i <= loopEnd; i++) {
            cy.get("#showingPages")
              .should("be.visible")
              .then(($el) => {
                const currentPageTexts = /Page\s([0-9]*)/.exec($el.text());
                const currentPage = parseInt(currentPageTexts[1]);
                cy.log("Now searching page " + currentPage + "...");
              })
              .then(() => {
                cy.findAllByText("Active")
                  .parents("article", { selector: ".slds-card" })
                  .not(".slds-tile")
                  //start of each
                  .each(($contractor) => {
                    const contractor = {
                      registrationNumber: "",
                      name: "",
                      industry: "",
                      county: "",
                      city: "",
                      email: "",
                      datesRegistered: [],
                      youngEnough: true,
                    };
                    cy.get($contractor)
                      .findByText("Registration Number:")
                      .next()
                      .invoke("text")
                      .then(($contractorRegistrationNumber) => {
                        contractor.registrationNumber =
                          $contractorRegistrationNumber;
                      })
                      .then(() => {
                        if (
                          allRegistrationNumbers.find(
                            ($el) => $el === contractor.registrationNumber
                          )
                        ) {
                          cy.log("We have this contractor already.");
                        } else {
                          cy.get($contractor)
                            .find('a[title="Accounts"]')
                            .invoke("text")
                            .then(($contractorName) => {
                              contractor.name = $contractorName;
                              cy.log("Found contractor: " + $contractorName);
                            });
                          cy.get($contractor)
                            .findByText("Craft:")
                            .next()
                            .invoke("text")
                            .then(($contractorIndustry) => {
                              contractor.industry = $contractorIndustry;
                            });
                          cy.get($contractor)
                            .findByText("County:")
                            .next()
                            .invoke("text")
                            .then(($contractorCounty) => {
                              contractor.county = $contractorCounty;
                            });
                          cy.get($contractor)
                            .findByText("Mailing Address:")
                            .next()
                            .then(($contractorCity) => {
                              contractor.city =
                                $contractorCity[0].innerHTML.split("<br>")[1];
                            });
                          cy.get($contractor)
                            .findByText("Email:")
                            .next()
                            .invoke("text")
                            .then(($contractorEmail) => {
                              contractor.email = $contractorEmail;
                            });

                          eligibleContractors.push(contractor);
                          allRegistrationNumbers.push(
                            contractor.registrationNumber
                          );
                        }
                      });
                  })
                  //end of each
                  .then(() => {
                    cy.get("#showingPages")
                      .should("be.visible")
                      .then(($el) => {
                        const currentPageTexts = /Page\s([0-9]*)/.exec(
                          $el.text()
                        );
                        const currentPage = parseInt(currentPageTexts[1]);
                        cy.log("Finished page " + currentPage + ".");
                        if (currentPage < pageEnd) {
                          cy.log("Loading next page...");
                          cy.get("#next").click();
                        } else if (currentPage === pageEnd) {
                          cy.task(
                            "log",
                            "Loop done! " +
                              eligibleContractors.length +
                              " contractors recorded."
                          );
                          cy.reload();
                        }
                      });
                  });
              });
          }
        }
      );
    }
    // ends the parent for loop
  }
);
