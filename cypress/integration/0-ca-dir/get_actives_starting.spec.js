const oldestAllowed = {
  title: "2022-01-17",
  year: 0,
  month: 0,
};
oldestAllowed.month = parseInt(oldestAllowed.title.split("-")[1]);
oldestAllowed.year = parseInt(oldestAllowed.title.split("-")[0]);

const newestAllowed = {
  title: "2022-02-06",
  year: 0,
  month: 0,
};
newestAllowed.month = parseInt(newestAllowed.title.split("-")[1]);
newestAllowed.year = parseInt(newestAllowed.title.split("-")[0]);

const eligibleContractors = [];
const allRegistrationNumbers = [];

const pageStart = 1;
const pageEnd = 57;
const currentPage = 1;
const pageInterval = 3;

const today = new Date();
const time =
  today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();

describe(
  "Get Active Contractors with Earliest Reg Date of " + oldestAllowed.title,
  () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    before("wrap", () => {
      const url =
        "https://cadir.secure.force.com/ContractorSearch?startDate=" +
        oldestAllowed.title +
        "&expirationDate=" +
        newestAllowed.title;
      cy.visit(url);

      for (let j = 1; j < pageStart; j++) {
        cy.get(".slds-card__header-title")
          .first()
          .find("a")
          .as("pauser")
          .then(($uniqueroo) => {
            cy.log("Fast-forwarding to next page...");
            cy.get("#totalResultCount").should("be.visible");
            cy.get("#next").click({ force: true });
            cy.expect("@pauser").to.not.eq($uniqueroo);
          });
      }
      // cy.log(allRegistrationNumbers);
    });

    after("write to the file", () => {
      cy.log(
        "We found " + allRegistrationNumbers.length + " contractors total."
      );
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
              .as("currentPage")
              .then(($el) => {
                const currentPageTexts = /Page\s([0-9]*)/.exec($el.text());
                const currentPage = parseInt(currentPageTexts[1]);
                cy.log("Now searching page " + currentPage + "...");
              })
              .then(($el) => {
                cy.findAllByText("Active")
                  .parents("article", { selector: ".slds-card" })
                  .not(".slds-tile")
                  //start of each
                  .each(($contractor, $contractorIndex) => {
                    const contractor = {
                      countID: ($contractorIndex + 1) * (h + 1),
                      registrationNumber: "",
                      name: "",
                      industry: "",
                      county: "",
                      city: "",
                      email: "",
                      oldestDate: "",
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
                        cy.get($contractor)
                          .find('td [title="EffectiveDate"]')
                          .last()
                          .invoke("text")
                          .then(($dateText) => {
                            contractor.oldestDate = $dateText;
                          })
                          .then(() => {
                            const dateSplit = contractor.oldestDate.split("/");
                            cy.log(oldestAllowed.year, oldestAllowed.month);
                            cy.log(
                              parseInt(dateSplit[2]),
                              parseInt(dateSplit[0])
                            );
                            if (
                              parseInt(dateSplit[2]) > oldestAllowed.year ||
                              (parseInt(dateSplit[2]) === oldestAllowed.year &&
                                parseInt(dateSplit[0]) >= oldestAllowed.month)
                            ) {
                              cy.get("@currentPage")
                                .should("be.visible")
                                .then(($element) => {
                                  const currentPageTexts =
                                    /Page\s([0-9]*)/.exec($element.text());
                                  const currentPage = parseInt(
                                    currentPageTexts[1]
                                  );
                                  contractor.countID =
                                    eligibleContractors.length + 1;
                                  eligibleContractors.push(contractor);
                                  cy.log(
                                    contractor.name +
                                      " first registered on " +
                                      contractor.oldestDate
                                  );
                                });
                              /*
                              allRegistrationNumbers.push(
                                contractor.registrationNumber
                              );
                              */
                              cy.get($contractor)
                                .find('a[title="Accounts"]')
                                .invoke("text")
                                .then(($contractorName) => {
                                  contractor.name = $contractorName;
                                  cy.get("@currentPage")
                                    .should("be.visible")
                                    .then(($element) => {
                                      const currentPageTexts =
                                        /Page\s([0-9]*)/.exec($element.text());
                                      const currentPage = parseInt(
                                        currentPageTexts[1]
                                      );
                                      contractor.foundOnPage = currentPage;
                                      cy.log(
                                        "FOUND CONTRACTOR: " +
                                          contractor.name +
                                          " on " +
                                          currentPage
                                      );
                                    });
                                });
                              /*
                              cy.get($contractor)
                                .findByText("Craft:")
                                .next()
                                .invoke("text")
                                .then(($contractorIndustry) => {
                                  contractor.industry = $contractorIndustry;
                                });
                                */
                              /*
                              cy.get($contractor)
                                .findByText("County:")
                                .next()
                                .invoke("text")
                                .then(($contractorCounty) => {
                                  contractor.county = $contractorCounty;
                                });
                                */
                              /*
                              cy.get($contractor)
                                .findByText("Mailing Address:")
                                .next()
                                .then(($contractorCity) => {
                                  contractor.city =
                                    $contractorCity[0].innerHTML.split(
                                      "<br>"
                                    )[1];
                                });
                                */
                              cy.get($contractor)
                                .findByText("Email:")
                                .next()
                                .invoke("text")
                                .then(($contractorEmail) => {
                                  contractor.email = $contractorEmail;
                                });
                            }
                          });
                      });
                  })
                  //end of each
                  .then(() => {
                    cy.get("@currentPage")
                      .should("be.visible")
                      .then(($element) => {
                        const currentPageTexts = /Page\s([0-9]*)/.exec(
                          $element.text()
                        );
                        const currentPage = parseInt(currentPageTexts[1]);
                        cy.log("Finished page " + currentPage + ".");
                        if (currentPage < pageEnd) {
                          cy.log("Loading next page...");
                          cy.get("#next").click({ force: true });
                        } else if (currentPage === pageEnd) {
                          cy.log("Loop done!");
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
