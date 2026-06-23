const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const animatedItems = document.querySelectorAll("[data-animate]");

requestAnimationFrame(() => {
  animatedItems.forEach((item, index) => {
    window.setTimeout(() => item.classList.add("is-visible"), index * 120);
  });
});

menuToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const checkSection = document.querySelector("#ukraine-check");
const checkTriggers = document.querySelectorAll("[data-check-trigger]");
const leadPopup = document.querySelector("[data-lead-popup]");
const leadPopupClose = document.querySelector("[data-lead-popup-close]");
const leadPopupAction = document.querySelector("[data-lead-popup-action]");
const isMobileViewport = window.matchMedia("(max-width: 820px)").matches;
const leadPopupDelay = isMobileViewport ? 30000 : 27000;
const leadPopupScrollTarget = isMobileViewport ? 40 : 35;
let leadPopupTimerReady = false;
let leadPopupScrollReady = false;
let leadPopupWasShown = sessionStorage.getItem("leadPopupShown") === "true";

const openCheckSection = () => {
  if (!checkSection) return;

  checkSection.hidden = false;
  checkSection.classList.add("is-open");
  checkSection.scrollIntoView({ behavior: "smooth", block: "start" });
};

checkTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    header.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    openCheckSection();
  });
});

const hideLeadPopup = (remember = false) => {
  if (!leadPopup) return;

  leadPopup.classList.remove("is-visible");

  window.setTimeout(() => {
    leadPopup.hidden = true;
  }, 260);

  if (remember) {
    sessionStorage.setItem("leadPopupClosed", "true");
  }
};

const showLeadPopup = () => {
  if (!leadPopup) return;
  if (leadPopupWasShown) return;
  if (sessionStorage.getItem("leadPopupClosed") === "true") return;
  if (sessionStorage.getItem("leadSubmitted") === "true") return;

  leadPopupWasShown = true;
  sessionStorage.setItem("leadPopupShown", "true");
  leadPopup.hidden = false;
  window.requestAnimationFrame(() => leadPopup.classList.add("is-visible"));
};

const getScrollProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

  if (scrollableHeight <= 0) return 100;

  return (window.scrollY / scrollableHeight) * 100;
};

const tryShowLeadPopup = () => {
  if (leadPopupTimerReady && leadPopupScrollReady) {
    showLeadPopup();
  }
};

const updateLeadPopupScroll = () => {
  leadPopupScrollReady = getScrollProgress() >= leadPopupScrollTarget;
  tryShowLeadPopup();
};

window.setTimeout(() => {
  leadPopupTimerReady = true;
  updateLeadPopupScroll();
}, leadPopupDelay);

window.addEventListener("scroll", updateLeadPopupScroll, { passive: true });

if (!isMobileViewport) {
  document.addEventListener("mouseleave", (event) => {
    if (event.clientY <= 0) {
      showLeadPopup();
    }
  });
}

leadPopupClose?.addEventListener("click", () => hideLeadPopup(true));

leadPopupAction?.addEventListener("click", () => {
  hideLeadPopup(true);
  document.querySelector("#contacts")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

const reviewsCarousel = document.querySelector("[data-reviews-carousel]");
const reviewCards = reviewsCarousel ? Array.from(reviewsCarousel.querySelectorAll(".review-card")) : [];
const reviewDots = Array.from(document.querySelectorAll("[data-carousel-dot]"));
const prevReview = document.querySelector("[data-carousel-prev]");
const nextReview = document.querySelector("[data-carousel-next]");

const getReviewIndex = () => {
  if (!reviewsCarousel || reviewCards.length === 0) return 0;

  const cardWidth = reviewCards[0].getBoundingClientRect().width;
  const gap = parseFloat(getComputedStyle(reviewsCarousel).columnGap) || 0;

  return Math.round(reviewsCarousel.scrollLeft / (cardWidth + gap));
};

const updateReviewDots = () => {
  const activeIndex = Math.min(getReviewIndex(), reviewDots.length - 1);

  reviewDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });
};

const scrollToReview = (index) => {
  if (!reviewsCarousel || !reviewCards[index]) return;

  reviewsCarousel.scrollTo({
    left: reviewCards[index].offsetLeft - reviewsCarousel.offsetLeft,
    behavior: "smooth",
  });
};

const pulseCarouselButton = (button) => {
  if (!button) return;

  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 1000);
};

prevReview?.addEventListener("click", () => {
  pulseCarouselButton(prevReview);
  scrollToReview(Math.max(getReviewIndex() - 1, 0));
});

nextReview?.addEventListener("click", () => {
  pulseCarouselButton(nextReview);
  scrollToReview(Math.min(getReviewIndex() + 1, reviewCards.length - 1));
});

reviewDots.forEach((dot, index) => {
  dot.addEventListener("click", () => scrollToReview(index));
});

reviewsCarousel?.addEventListener("scroll", () => {
  window.requestAnimationFrame(updateReviewDots);
});

const initLeadForm = () => {
  const leadForm = document.querySelector(".lead-form");

  if (!leadForm) return;

  const webhookUrl = "https://hook.eu1.make.com/ro7y86433tu2tlv6vdwkfbkg245q9yio";
  const leadSubmitButton = leadForm.querySelector(".form-submit");

  leadSubmitButton?.addEventListener("click", async (event) => {
    event.preventDefault();

    const status = leadForm.querySelector(".form-status");
    const formData = new FormData(leadForm);
    const selectedBudget = leadForm.querySelector('input[name="budget"]:checked');
    const budgetText = selectedBudget?.closest("label")?.textContent.trim() || formData.get("budget");

    const payload = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      budget: budgetText,
    };

    if (status) {
      status.textContent = "";
      status.classList.remove("is-error", "is-success");
    }

    leadSubmitButton.disabled = true;
    leadSubmitButton.textContent = "Відправляємо...";

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Webhook request failed");
      }

      if (typeof fbq === "function") {
        fbq("track", "Lead");
      }

      sessionStorage.setItem("leadSubmitted", "true");
      hideLeadPopup(true);

      leadForm.reset();

      if (status) {
        status.textContent = "Дякуємо! Ми зв'яжемося з Вами найближчим часом.";
        status.classList.add("is-success");
      }
    } catch (error) {
      if (status) {
        status.textContent = "Не вдалося відправити заявку. Спробуйте ще раз.";
        status.classList.add("is-error");
      }
    } finally {
      leadSubmitButton.disabled = false;
      leadSubmitButton.textContent = "Отримати підбір авто";
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLeadForm);
} else {
  initLeadForm();
}
