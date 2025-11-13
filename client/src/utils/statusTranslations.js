// German translations for order statuses
export const translateStatus = (status) => {
  const translations = {
    new: "Neu",
    accepted: "Akzeptiert",
    preparing: "In Bearbeitung",
    on_the_way: "Unterwegs",
    delivered: "Geliefert",
    canceled: "Storniert",
  };
  return translations[status] || status;
};

