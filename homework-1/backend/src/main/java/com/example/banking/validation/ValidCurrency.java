package com.example.banking.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that a String is a valid ISO 4217 currency code (e.g. USD, EUR, GBP, JPY).
 * Null/blank values pass here and are handled by {@code @NotBlank} so error messages stay
 * specific.
 */
@Documented
@Constraint(validatedBy = CurrencyValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCurrency {

    String message() default "Invalid currency code";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
