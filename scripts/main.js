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

document.querySelector(".lead-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
});
